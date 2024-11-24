DROP DATABASE IF EXISTS DevSync;
CREATE DATABASE DevSync;

USE DevSync;

DROP TABLE IF EXISTS `likes`;
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `posts_favorites`;
DROP TABLE IF EXISTS `posts_categories`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `posts`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE IF NOT EXISTS `users` (
   `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
   `login` VARCHAR(64) NOT NULL,
   `email` VARCHAR(255) NOT NULL,
   `fullName` VARCHAR(64),
   `password` VARCHAR(128) NULL,
   `isEmailVerified` BOOLEAN NOT NULL DEFAULT FALSE,
   `profilePicture` VARCHAR(50) DEFAULT 'default.png',
   `rating` int(10) NOT NULL DEFAULT 0 COMMENT 'The sum of all likes under all posts and comments. You have to subtract dislikes from this value, of course. It is calculated automatically for each user.',
   `role` ENUM ('user', 'admin') DEFAULT 'user' NOT NULL,
   `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`),
   UNIQUE KEY `email` (`email`),
   UNIQUE KEY `login` (`login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `posts` (
   `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
   `title` VARCHAR(256) NOT NULL,
   `content` TEXT NOT NULL,
   `status` ENUM ('active', 'inactive') DEFAULT 'active' NOT NULL,
   `isTop` BOOLEAN DEFAULT FALSE,
   `likes` INT(10) DEFAULT 0,
   `createdById` INT(10) UNSIGNED NOT NULL,
   `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`),
   INDEX `i_posts_createdById` (createdById),
   CONSTRAINT `fk_posts_createdById` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(36) NOT NULL,
    `description` VARCHAR(1024) DEFAULT '',
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `posts_categories` (
    `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `postId` INT(10) UNSIGNED NOT NULL,
    `categoryId` INT(10) UNSIGNED NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `post_category` (`postId`, `categoryId`),
    INDEX `i_posts_categories_categoryId` (categoryId),
    INDEX `i_posts_categories_postId` (postId),
    CONSTRAINT `fk_posts_categories_categoryId` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_posts_categories_postId` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `posts_favorites` (
    `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `createdById` INT(10) UNSIGNED NOT NULL,
    `postId` INT(10) UNSIGNED NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `post_user` (`postId`, `createdById`),
    INDEX `i_posts_favorites_createdById` (createdById),
    CONSTRAINT `fk_posts_favorites_postId` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_posts_favorites_createdById` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `comments` (
    `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `commentId` INT(10) UNSIGNED NULL,
    `postId` INT(10) UNSIGNED NOT NULL,
    `createdById` INT(10) UNSIGNED NOT NULL,
    `content` TEXT NOT NULL,
    `isBest` BOOLEAN DEFAULT FALSE,
    `status` ENUM ('active', 'inactive') DEFAULT 'active' NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `i_comments_postId` (postId),
    INDEX `i_comments_createdById` (createdById),
    CONSTRAINT `fk_comments_postId` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_comments_createdById` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `likes` (
    `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `createdById` INT(10) UNSIGNED NOT NULL,
    `postId` INT(10) UNSIGNED NULL,
    `commentId` INT(10) UNSIGNED NULL,
    `type` ENUM ('like', 'dislike') DEFAULT 'like' NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_comment_like_user` (`createdById`, `commentId`),
    UNIQUE KEY `uk_post_like_user` (`createdById`, `postId`),
    INDEX `i_likes_commentId` (commentId),
    INDEX `i_likes_postId` (postId),
    INDEX `i_likes_createdById` (createdById),
    CONSTRAINT `fk_likes_postId` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_likes_createdById` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_likes_commentId` FOREIGN KEY (`commentId`) REFERENCES `comments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;