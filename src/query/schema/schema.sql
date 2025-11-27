-- Read Model Database Schema for Group Chat

-- グループチャットテーブル
CREATE TABLE IF NOT EXISTS group_chats (
    id VARCHAR(26) PRIMARY KEY COMMENT 'GroupChat ID (ULID)',
    name VARCHAR(255) NOT NULL COMMENT 'グループチャット名',
    owner_id VARCHAR(26) NOT NULL COMMENT 'オーナーのUserAccount ID',
    member_count INT NOT NULL DEFAULT 0 COMMENT 'メンバー数',
    message_count INT NOT NULL DEFAULT 0 COMMENT 'メッセージ数',
    deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '削除フラグ',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    INDEX idx_owner_id (owner_id),
    INDEX idx_deleted (deleted),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='グループチャット';

-- メンバーテーブル
CREATE TABLE IF NOT EXISTS group_chat_members (
    id VARCHAR(26) PRIMARY KEY COMMENT 'Member ID (ULID)',
    group_chat_id VARCHAR(26) NOT NULL COMMENT 'GroupChat ID',
    user_account_id VARCHAR(26) NOT NULL COMMENT 'UserAccount ID',
    role VARCHAR(20) NOT NULL COMMENT 'ロール (ADMIN, MEMBER)',
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '参加日時',
    INDEX idx_group_chat_id (group_chat_id),
    INDEX idx_user_account_id (user_account_id),
    INDEX idx_group_chat_user (group_chat_id, user_account_id),
    FOREIGN KEY (group_chat_id) REFERENCES group_chats(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='グループチャットメンバー';

-- メッセージテーブル
CREATE TABLE IF NOT EXISTS group_chat_messages (
    id VARCHAR(26) PRIMARY KEY COMMENT 'Message ID (ULID)',
    group_chat_id VARCHAR(26) NOT NULL COMMENT 'GroupChat ID',
    sender_id VARCHAR(26) NOT NULL COMMENT '送信者のUserAccount ID',
    text TEXT NOT NULL COMMENT 'メッセージ本文',
    deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '削除フラグ',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    INDEX idx_group_chat_id (group_chat_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_created_at (created_at),
    INDEX idx_deleted (deleted),
    FOREIGN KEY (group_chat_id) REFERENCES group_chats(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='グループチャットメッセージ';
