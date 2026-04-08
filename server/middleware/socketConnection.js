import { io } from "../server.js";
import Message from "../models/Message.js";

const onlineUsers = new Map(); // userId → socketId

const socketConnection = () => {
  return io.on("connection", (socket) => {
    socket.on("join_room", (room) => {
      socket.join(room);
    });

    socket.on("user_connected", (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });

    socket.on("get_unread_notifications", async (data) => {
      const { userId, role } = data;
      try {
        let query = { read: false };
        if (role === "admin") {
          // الأدمن يحتاج كل الرسائل غير المقروءة اللي باعتها البائعين
          query.role = "seller";
        } else {
          // البائع يحتاج كل الرسائل غير المقروءة اللي باعتها الأدمن في غرفته
          query.role = "admin";
          query.room = `seller_${userId}`;
        }

        const unreadMessages = await Message.find(query).sort({ timestamp: -1 });
        socket.emit("initial_notifications", unreadMessages);
      } catch (error) {
        console.error("Error fetching unread notifications:", error);
      }
    });

    socket.on("receive_message", (data) => {
      Message.find({ room: data.room }).then((messages) => {
        socket.emit("receive_message", messages);
      });
    });

    socket.on("send_message", async (data) => {
      const msg = new Message(data);
      await msg.save(); // بنسيف الرسالة عشان ناخد الـ _id الحقيقي

      // بنبعت النسخة اللي اتسيفت (عشان تتضمن الـ _id) للكل
      // Broadcast to specific room
      io.to(data.room).emit("receive_message", msg);

      // تنبيه الأدمن لو الرسالة في غرفة شات
      if (data.room.startsWith("seller_") && msg.role === "seller") {
        console.log(
          `[Server] Notifying admins room about message in ${data.room}`,
        );
        io.to("admins_notifications").emit("new_notification", msg);
      }
    });

    // أحداث قراءة الرسائل
    socket.on("mark_as_read", async (messageId) => {
      try {
        const updatedMsg = await Message.findByIdAndUpdate(
          messageId,
          { read: true },
          { new: true },
        );
        if (updatedMsg) {
          // بلغ الغرفة ان الرسالة اتعدلت
          io.to(updatedMsg.room).emit("edit_message", updatedMsg);
        }
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    });

    // أحداث الكتابة
    socket.on("typing", (data) => {
      socket.to(data.room).emit("user_typing", {
        username: data.username,
        isTyping: true,
      });
    });

    socket.on("stop_typing", (data) => {
      socket.to(data.room).emit("user_typing", {
        username: data.username,
        isTyping: false,
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // شيل اليوزر من الـ Map وبعت القائمة المحدثة
      for (const [userId, sId] of onlineUsers) {
        if (sId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });
  });
};

export default socketConnection;
