import React from "react";

export default function SellersSidebar({
  showSidebar,
  setShowSidebar,
  sellers,
  selectedSeller,
  handleSellerClick,
  onlineUsers,
  t,
}) {
  return (
    <div className={`sellers-sidebar ${showSidebar ? "open" : ""}`}>
      <div className="sidebar-header">
        <h3>{t("sellers")}</h3>
        <button
          className="close-sidebar-btn"
          onClick={() => setShowSidebar(false)}
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div className="sellers-list-items">
        {sellers.map((seller) => (
          <button
            key={seller?._id}
            className={`seller-btn ${selectedSeller?._id === seller?._id ? "active" : ""}`}
            onClick={() => handleSellerClick(seller)}
          >
            <span className="seller-name-container">
              {seller.username}
              {onlineUsers.includes(seller._id) && (
                <span className="online-indicator"></span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
