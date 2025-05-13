import React, { useState, useEffect, useRef, useMemo } from "react";
import { FiSend } from "react-icons/fi";
import { FaImage, FaCheck } from "react-icons/fa6";
import io from "socket.io-client";
import { BASE_URL, API_URL } from "../../config";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "react-modal";

// Thêm component Avatar riêng
const Avatar = React.memo(({ src, alt, isOnline, className = "" }) => {
  const [imgSrc, setImgSrc] = useState("/default-avatar.png");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (src) {
      setIsLoading(true);
      setError(false);
      // Tạo một Image object để preload
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImgSrc(src);
        setIsLoading(false);
      };
      img.onerror = () => {
        setError(true);
        setIsLoading(false);
        setImgSrc("/default-avatar.png"); // Đảm bảo luôn có avatar mặc định khi lỗi
      };
    }
  }, [src]);

  return (
    <div className="relative">
      <img
        src={imgSrc}
        alt={alt}
        className={`w-10 h-10 rounded-full border shadow-md object-cover transition-opacity duration-200 ${
          isLoading ? "opacity-0" : "opacity-100"
        } ${className}`}
        loading="lazy"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-[#FF5733] rounded-full animate-spin"></div>
        </div>
      )}
      {isOnline && !isLoading && !error && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      )}
    </div>
  );
});

export default function TicketChat({ ticket, currentUser, fetchTicketById }) {
  const socketRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const tempToRealIdRef = useRef({});
  const isSendingRef = useRef(false); // ngay cùng nhóm với tempToRealIdRef
  // Lưu tin nhắn dưới dạng đối tượng sử dụng messageId làm key
  const [messagesMap, setMessagesMap] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageCaption, setImageCaption] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [seenMessages, setSeenMessages] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const MESSAGES_PER_PAGE = 20;
  const [messageStatus, setMessageStatus] = useState({});

  // Tạo danh sách tin nhắn từ messagesMap để hiển thị
  const messages = useMemo(() => {
    return Object.values(messagesMap).sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
  }, [messagesMap]);

  // Thêm useEffect để tự động cuộn xuống khi mount và khi có tin nhắn mới
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom(false); // false để không có animation khi mount
    }
  }, [messages, autoScroll]);

  // Thêm useEffect để scroll xuống khi component mount
  useEffect(() => {
    scrollToBottom(false);
  }, []); // Empty dependency array means this runs once on mount

  // Hàm nén ảnh trước khi upload
  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(
                new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                })
              );
            },
            "image/jpeg",
            0.7
          );
        };
      };
    });
  };

  // Load thêm tin nhắn cũ
  const loadMoreMessages = async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(
        `${API_URL}/tickets/${ticket._id}/messages?page=${page + 1}&limit=${MESSAGES_PER_PAGE}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const newMessages = res.data.messages;
        if (newMessages.length < MESSAGES_PER_PAGE) {
          setHasMore(false);
        }

        // Thêm tin nhắn mới vào map
        setMessagesMap((prev) => {
          const newMap = { ...prev };
          newMessages.forEach((msg) => {
            const formattedMsg = formatMessage(msg, currentUser);
            newMap[formattedMsg.id] = formattedMsg;
          });
          return newMap;
        });

        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Lỗi khi load thêm tin nhắn:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Thêm hàm gửi trạng thái đã nhận
  const sendMessageReceived = (messageId) => {
    if (socketRef.current) {
      socketRef.current.emit("messageReceived", {
        ticketId: ticket._id,
        messageId,
        userId: currentUser.id,
      });
    }
  };

  // Thêm hàm gửi trạng thái đã xem
  const sendMessageSeen = (messageId) => {
    if (socketRef.current) {
      socketRef.current.emit("messageSeen", {
        ticketId: ticket._id,
        messageId,
        userId: currentUser.id,
      });
      setSeenMessages((prev) => ({
        ...prev,
        [messageId]: [...(prev[messageId] || []), currentUser.id],
      }));
    }
  };

  // Thêm hàm kiểm tra tin nhắn mới khi scroll
  const checkNewMessages = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      // Nếu gần cuối, đánh dấu tất cả tin nhắn chưa xem là đã xem
      if (isNearBottom) {
        messages.forEach((msg) => {
          if (!msg.isSelf && !seenMessages[msg.id]?.includes(currentUser.id)) {
            sendMessageSeen(msg.id);
          }
        });
      }
    }
  };

  // Định dạng tin nhắn
  const formatMessage = (msg, currentUser) => ({
    id: msg._id?.toString(),
    text: msg.text,
    sender: msg.sender?.fullname || "N/A",
    senderId: msg.sender?._id,
    senderAvatar: (() => {
      const path = msg.sender?.avatarUrl || "";
      if (!path) return "/default-avatar.png";
      return path.startsWith("http") || path.startsWith("/uploads")
        ? path
        : `${BASE_URL}/uploads/Avatar/${path}`;
    })(),
    time: new Date(msg.timestamp).toLocaleString("vi-VN"),
    timestamp: msg.timestamp || new Date(),
    type: msg.type || "text",
    isSelf: msg.sender?._id === currentUser?.id,
    caption: msg.caption || "",
  });

  // Reset state khi ticket thay đổi
  useEffect(() => {
    setMessagesMap({});
    setPage(1);
    setHasMore(true);
    setMessageStatus({});
    setSeenMessages({});

    // Đảm bảo socket cũ được disconnect trước khi tạo socket mới
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [ticket?._id]);

  // Socket events
  useEffect(() => {
    // Đảm bảo chỉ tạo một socket connection
    if (!socketRef.current && ticket?._id) {
      const token = localStorage.getItem("authToken");
      socketRef.current = io(BASE_URL, { query: { token } });

      socketRef.current.emit("joinTicket", ticket._id);
      socketRef.current.emit("userOnline", {
        userId: currentUser.id,
        ticketId: ticket._id,
      });

      // Lắng nghe sự kiện typing
      socketRef.current.on("userTyping", ({ userId, isTyping }) => {
        setTypingUsers((prev) => ({
          ...prev,
          [userId]: isTyping,
        }));
      });

      // Lắng nghe sự kiện online/offline
      socketRef.current.on("userStatus", ({ userId, status }) => {
        setOnlineUsers((prev) => ({
          ...prev,
          [userId]: status,
        }));
      });

      // Lắng nghe tin nhắn mới
      socketRef.current.on("receiveMessage", (data) => {
        const msgId = data._id?.toString();
        const tempId = data.tempId;

        setMessagesMap((prev) => {
          // Nếu đã có bản gốc → chỉ gỡ bản temp (nếu còn) rồi thoát
          if (msgId && prev[msgId]) {
            if (tempId && prev[tempId]) {
              const clone = { ...prev };
              delete clone[tempId];
              return clone;
            }
            return prev;
          }

          // Chuẩn hoá avatar
          const avatarPath = data.sender.avatarUrl || "";
          const senderAvatar =
            avatarPath.startsWith("http") || avatarPath.startsWith("/uploads")
              ? avatarPath
              : `${BASE_URL}/uploads/Avatar/${avatarPath}`;

          const formatted = {
            id: msgId || tempId,
            text: data.text,
            sender: data.sender.fullname,
            senderId: data.sender._id,
            senderAvatar,
            time: new Date(data.timestamp).toLocaleString("vi-VN"),
            timestamp: data.timestamp,
            type: data.type,
            isSelf: data.sender._id === currentUser?.id,
            caption: data.caption || "",
          };

          if (msgId && tempId) {
            tempToRealIdRef.current[tempId] = msgId;
          }

          const clone = { ...prev };
          if (tempId && formatted.isSelf && clone[tempId]) delete clone[tempId];
          if (msgId) clone[msgId] = formatted;

          return clone;
        });

        // gửi trạng thái received / seen
        if (msgId && data.sender._id !== currentUser?.id) {
          sendMessageReceived(msgId);
          if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } =
              chatContainerRef.current;
            if (scrollHeight - scrollTop - clientHeight < 100)
              sendMessageSeen(msgId);
          }
        }
      });

      // Lắng nghe trạng thái đã nhận
      socketRef.current.on("messageReceived", ({ messageId, userId }) => {
        setMessageStatus((prev) => {
          const cur = prev[messageId] || { received: [], seen: [] };
          if (cur.received.includes(userId)) return prev;
          return {
            ...prev,
            [messageId]: { ...cur, received: [...cur.received, userId] },
          };
        });
      });

      // Lắng nghe trạng thái đã xem
      socketRef.current.on("messageSeen", ({ messageId, userId }) => {
        setMessageStatus((prev) => {
          const cur = prev[messageId] || { received: [], seen: [] };
          if (cur.seen.includes(userId)) return prev;
          return {
            ...prev,
            [messageId]: { ...cur, seen: [...cur.seen, userId] },
          };
        });
      });
    }

    return () => {
      if (socketRef.current) {
        console.log("Disconnecting socket on cleanup");
        if (ticket?._id) socketRef.current.emit("leaveTicket", ticket._id);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [ticket?._id, currentUser?.id]);

  // Tải tin nhắn khi ticket thay đổi
  useEffect(() => {
    if (ticket && ticket.messages) {
      const newMessagesMap = {};
      ticket.messages.forEach((msg) => {
        const formattedMsg = formatMessage(msg, currentUser);
        newMessagesMap[formattedMsg.id] = formattedMsg;
      });
      setMessagesMap(newMessagesMap);
    }
  }, [ticket, currentUser?.id]);

  // Thêm useEffect để kiểm tra tin nhắn mới khi scroll
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener("scroll", checkNewMessages);
      return () =>
        chatContainer.removeEventListener("scroll", checkNewMessages);
    }
  }, [messages]);

  // Xử lý typing
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit("typing", {
        ticketId: ticket._id,
        isTyping: true,
      });

      setTimeout(() => {
        setIsTyping(false);
        socketRef.current.emit("typing", {
          ticketId: ticket._id,
          isTyping: false,
        });
      }, 3000);
    }
  };

  // Gửi tin nhắn
  const handleSendMessage = () => {
    if (isSendingRef.current) return; // đang gửi → bỏ
    if (!newMessage.trim() || !ticket?._id) return;
    isSendingRef.current = true; // khoá 1 tick

    // Tạo tin nhắn tạm với ID tạm
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage = {
      id: tempId,
      text: newMessage,
      sender: currentUser.fullname,
      senderId: currentUser.id,
      senderAvatar: currentUser.avatarUrl
        ? `${BASE_URL}/uploads/Avatar/${currentUser.avatarUrl}`
        : "/default-avatar.png",
      time: new Date().toLocaleString("vi-VN"),
      timestamp: new Date(),
      type: "text",
      isSelf: true,
      pending: true,
    };

    // Thêm tin nhắn tạm vào map
    setMessagesMap((prev) => {
      if (tempToRealIdRef.current[tempId]) return prev; // đã có realId
      return { ...prev, [tempId]: tempMessage };
    });

    // Gửi tin nhắn
    socketRef.current.emit("sendMessage", {
      ticketId: ticket._id,
      text: newMessage,
      sender: {
        _id: currentUser.id,
        fullname: currentUser.fullname,
        avatarUrl: currentUser.avatarUrl || "",
      },
      timestamp: new Date(),
      type: "text",
      tempId,
    });

    setNewMessage("");
    setTimeout(() => {
      isSendingRef.current = false;
    }, 500);
  };

  // Upload file
  const handleFileChange = async (e) => {
    let file;
    if (e.target && e.target.files) {
      file = e.target.files[0];
    } else if (e.dataTransfer && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    }
    if (!file || !ticket?._id) return;

    // Nén ảnh nếu là file hình ảnh
    if (file && file.type.startsWith("image/")) {
      file = await compressImage(file);
    }

    // Tạo ID tạm và thêm tin nhắn tạm
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempUrl = URL.createObjectURL(file);

    // Thêm tin nhắn tạm vào map
    setMessagesMap((prev) => ({
      ...prev,
      [tempId]: {
        id: tempId,
        text: tempUrl,
        sender: currentUser.fullname,
        senderId: currentUser.id,
        senderAvatar: currentUser.avatarUrl
          ? `${BASE_URL}/uploads/Avatar/${currentUser.avatarUrl}`
          : "/default-avatar.png",
        time: new Date().toLocaleString("vi-VN"),
        timestamp: new Date(),
        type: "image",
        isSelf: true,
        pending: true,
      },
    }));

    try {
      setIsUploading(true);
      setUploadProgress(0);
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tempId", tempId);

      // Upload file
      const res = await axios.post(
        `${API_URL}/tickets/${ticket._id}/messages`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      if (res.data.success) {
        setUploadProgress(0);
      }
    } catch (error) {
      console.error("Lỗi khi upload file:", error);
      toast.error("Lỗi upload file.");

      // Xóa tin nhắn pending khi upload lỗi
      setMessagesMap((prev) => {
        const newMap = { ...prev };
        delete newMap[tempId];
        return newMap;
      });
    } finally {
      URL.revokeObjectURL(tempUrl);
      setIsUploading(false);
    }
  };

  // Drag & drop event handler
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Drop event triggered");
    await handleFileChange(e);
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 80) {
      setAutoScroll(true);
    } else {
      setAutoScroll(false);
    }
  };

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  };

  return (
    <div
      className="bg-white w-full h-full flex flex-col"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF5733]"></div>
        </div>
      )}

      {/* Chat messages */}
      <div
        className="flex-1 overflow-auto space-y-4 p-4"
        ref={chatContainerRef}
        onScroll={(e) => {
          handleScroll();
          if (e.target.scrollTop === 0) {
            loadMoreMessages();
          }
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {messages.map((m) => {
          const isSelf = m.isSelf;
          const status = messageStatus[m.id] || {};
          const isReceived = status.received?.some(
            (id) => id !== currentUser.id
          );
          const isSeen = status.seen?.some((id) => id !== currentUser.id);
          const avatarUrl = m.senderAvatar;

          return (
            <div
              key={`${m.id}`}
              className={`flex items-start gap-3 ${
                isSelf ? "justify-end" : "justify-start"
              }`}
            >
              {!isSelf && (
                <Avatar
                  src={m.senderAvatar || "/default-avatar.png"}
                  alt={m.sender}
                  isOnline={onlineUsers[m.senderId]}
                />
              )}
              <div className="flex flex-col max-w-[70%]">
                {m.type === "image" ||
                (typeof m.text === "string" &&
                  (m.text.startsWith("/uploads/Messages/") ||
                    (m.text.startsWith("http://") &&
                      m.text.includes("/uploads/Messages/")))) ? (
                  <img
                    src={
                      m.text.startsWith("http")
                        ? m.text
                        : `${BASE_URL}${m.text}`
                    }
                    alt="uploaded"
                    className="max-w-xs rounded-lg border cursor-pointer hover:opacity-90 transition"
                    onClick={() =>
                      window.open(
                        m.text.startsWith("http")
                          ? m.text
                          : `${BASE_URL}${m.text}`,
                        "_blank"
                      )
                    }
                  />
                ) : (
                  <div
                    className={`px-3 py-2 rounded-lg text-sm ${
                      isSelf
                        ? "bg-[#E4E9EF] text-[#002147]"
                        : "bg-[#EBEBEB] text-[#757575]"
                    }`}
                  >
                    {m.text}
                  </div>
                )}
                <div className="flex items-center gap-2 text-[11px] text-[#757575] mt-1">
                  <span>{m.time}</span>
                  {isSelf && (
                    <div className="flex justify-end ml-auto">
                      {m.pending ? (
                        <span className="opacity-50 italic text-xs">
                          Đang gửi...
                        </span>
                      ) : isSeen ? (
                        <div className="flex text-[#002855]">
                          <FaCheck size={8} className="relative" />
                          <FaCheck size={8} className="relative -ml-1" />
                        </div>
                      ) : isReceived ? (
                        <div className="flex text-gray-500">
                          <FaCheck size={8} className="relative" />
                          <FaCheck size={8} className="relative -ml-1" />
                        </div>
                      ) : (
                        <FaCheck size={8} className="text-gray-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              {isSelf && (
                <Avatar
                  src={
                    currentUser?.avatarUrl
                      ? currentUser.avatarUrl.startsWith("http") ||
                        currentUser.avatarUrl.startsWith("/uploads")
                        ? currentUser.avatarUrl
                        : `${BASE_URL}/uploads/Avatar/${currentUser.avatarUrl}`
                      : "/default-avatar.png"
                  }
                  alt={currentUser.fullname}
                  isOnline={onlineUsers[currentUser.id]}
                />
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {Object.entries(typingUsers).some(
        ([userId, isTyping]) => isTyping && userId !== currentUser.id
      ) && (
        <div className="text-sm text-gray-500 italic px-4">
          Đang nhập tin nhắn...
        </div>
      )}

      {/* Input area */}
      <div className="flex items-center gap-2 p-4 border-t">
        <button
          onClick={() => document.getElementById("fileInput").click()}
          className="bg-gray-200 text-gray-700 p-3 rounded-full hover:bg-gray-300 transition"
          disabled={isUploading}
        >
          <FaImage />
        </button>
        <input
          type="file"
          id="fileInput"
          style={{ display: "none" }}
          onChange={handleFileChange}
          accept="image/*"
          disabled={isUploading}
        />
        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          className="w-full p-3 border-none bg-[#EBEBEB] rounded-full text-sm focus:ring-2 focus:ring-[#FF5733]"
          disabled={isUploading}
        />
        <button
          onClick={handleSendMessage}
          className="bg-[#FF5733] text-white p-3 rounded-full hover:bg-[#E44D26] transition disabled:opacity-50"
          disabled={isUploading || !newMessage.trim()}
        >
          <FiSend />
        </button>
      </div>

      {/* Upload progress */}
      {isUploading && (
        <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50">
          <div className="w-64">
            <div className="text-sm mb-2">Đang upload... {uploadProgress}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#FF5733] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to convert dataURL to File
function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
