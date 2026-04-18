import { io } from "../server.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import path from "path";
import fs from "fs";
const onlineUsers = new Map(); // userId → socketId

const socketConnection = () => {
  return io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("join_room", (room) => {
      // room   >> is a seller id that when admin send message to this seller or open messages of this seller
      const isAdmin = socket.userRole === "admin";
      const isOwner = room === "seller_" + socket.userId;

      if (!isAdmin && !isOwner) {
        console.log(
          `❌ User ${socket.userId} is not authorized to join room ${room}`,
        );
        return;
      }

      for (const r of socket.rooms) {
        if (r.startsWith("seller_") && r !== room) {
          socket.leave(r);
          console.log(`🏃 User left room: ${r}`);
        }
      }
      // 2. انضم للغرفة الجديدة
      socket.join(room);
      console.log(`📍 User joined room: ${room}`);
    });

    socket.on("send_message", (data) => sendMessage(data, io));

    socket.on("get_messages", (roomId) => getMessages(roomId, io));

    socket.on("admin_logged_in", async () => {
      const sellers = await User.find({ role: "seller" }).select("-password");
      socket.emit("sellers_list", sellers);
    });

    socket.on("register_user", ({ userId, role }) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.userRole = role;
      console.log("onlineUsers >>> ", onlineUsers);
      io.emit("get_online_users", Array.from(onlineUsers.keys()));
      console.log("onlineUsers >>> ", Array.from(onlineUsers.keys()));
    });

    socket.on("typing", (data) => {
      // data تحتوي على الـ room وحالة الكتابة (true/false)
      socket.to(data.room).emit("display_typing", data);
    });

    socket.on("stop_typing", (data) => {
      // data تحتوي على الـ room وحالة الكتابة (true/false)
      socket.to(data.room).emit("display_stop_typing", data);
    });

    socket.on("get_unread_messages_counts", () =>
      getUnreadMessagesCounts(socket),
    );

    socket.on("mark_messages_read", (roomId) => {
      updateMessages(roomId, io);
    });

    socket.on("delete_message", (data) => deleteMessage(data, io));

    socket.on("get_last_seen", async (userId) => {
      try {
        const user = await User.findById(userId).select("lastSeen");
        if (user && user.lastSeen) {
          socket.emit("user_last_seen", { userId, lastSeen: user.lastSeen });
        }
      } catch (err) {
        console.error("Error getting last seen:", err);
      }
    });

    socket.on("disconnect", async () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        const now = new Date();
        // حفظ في قاعدة البيانات
        await User.findByIdAndUpdate(socket.userId, { lastSeen: now });
        io.emit("get_online_users", Array.from(onlineUsers.keys()));
        io.emit("user_last_seen", {
          userId: socket.userId,
          lastSeen: now,
        });
      }
    });
  });
};

export default socketConnection;

const sendMessage = async (data, io) => {
  try {
    const { room, author, message, role, fileUrl, fileName, fileType } = data;
    const newMessage = new Message({
      room,
      author,
      message,
      role,
      fileUrl,
      fileName,
      fileType,
    });
    // save message in database
    await newMessage.save();
    // send message to room
    console.log("newMessage >>> ", newMessage);

    io.to(room).emit("receive_message", newMessage);

    io.to("admins_room").emit("new_notification", newMessage); // غيرنا الاسم هنا

    io.emit("global_notification", {
      room,
      message: newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

const getMessages = async (roomId, io) => {
  const messages = await Message.find({ room: roomId });

  io.to(roomId).emit("messages_history", messages);
};

const updateMessages = async (roomId, io) => {
  try {
    // سنستخدم updateMany لتعديل كل الرسائل في هذه الغرفة التي لم تقرأ بعد
    await Message.updateMany({ room: roomId, read: false }, { read: true });

    io.to(roomId).emit("messages_read", { roomId });

    console.log(`✅ Room ${roomId} marked as read`);
  } catch (err) {
    console.error("Error marking as read:", err);
  }
};

const getUnreadMessagesCounts = async (socket) => {
  try {
    const counts = await Message.aggregate([
      { $match: { read: false, role: "seller" } }, // ابحث عن الرسائل غير المقروءة فقط
      { $group: { _id: "$room", count: { $sum: 1 } } }, // اجمعهم بحسب الغرفة وعدهم
    ]);
    // أرسل النتيجة للأدمن لكي يضعها في الـ Notifications
    socket.emit("unread_counts_history", counts);
  } catch (err) {
    console.error("Error fetching unread counts:", err);
  }
};

const deleteMessage = async (data, io) => {
  try {
    const { messageId, room } = data;

    const messageToDelete = await Message.findById(messageId);
    if (!messageToDelete) return;

    if (messageToDelete.fileUrl) {
      const fileName = messageToDelete.fileUrl.split("/uploads/")[1];

      if (fileName) {
        const filePath = path.join(process.cwd(), "uploads", fileName);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Physical file ${fileName} deleted`);
        }
      }
    }

    // 3. نحذف الرسالة من الداتا بيز اخيراً
    await Message.findByIdAndDelete(messageId);

    // 4. نبلغ كل اللي في الغرفة إن الرسالة اتمسحت
    io.to(room).emit("message_deleted", { messageId });
    console.log(`🗑️ Message ${messageId} deleted from DB`);
  } catch (err) {
    console.error("Error deleting message:", err);
  }
};
