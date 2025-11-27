-- users
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150),
  phone VARCHAR(30) UNIQUE,
  avatar VARCHAR(255),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- chats (percakapan: grup atau 1-on-1)
CREATE TABLE chats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NULL,
  is_group TINYINT(1) DEFAULT 0,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- chat_members
CREATE TABLE chat_members (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  chat_id BIGINT,
  user_id BIGINT,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_message_id BIGINT NULL,
  FOREIGN KEY (chat_id) REFERENCES chats(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- messages
CREATE TABLE messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  chat_id BIGINT,
  sender_id BIGINT,
  body TEXT,                -- teks (boleh null jika hanya attachment)
  reply_to_message_id BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP NULL,
  status TINYINT DEFAULT 0, -- 0=sent/server,1=delivered,2=read (optional global)
  FOREIGN KEY (chat_id) REFERENCES chats(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- attachments
CREATE TABLE attachments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  message_id BIGINT,
  type ENUM('image','video','audio','file'),
  url VARCHAR(500),
  filename VARCHAR(255),
  size BIGINT,
  meta JSON NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id)
);

-- message_receipts (per penerima)
CREATE TABLE message_receipts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  message_id BIGINT,
  user_id BIGINT,
  delivered_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
