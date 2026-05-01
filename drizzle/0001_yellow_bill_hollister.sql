CREATE TABLE `activity_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`entityType` varchar(64),
	`entityId` varchar(64),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `glossary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`definition` text NOT NULL,
	`attachments` json,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `glossary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `room_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`userId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `room_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdBy` int NOT NULL,
	`parentId` int,
	`memberCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`userId` int NOT NULL,
	`birthdate` varchar(10),
	`location` varchar(255),
	`profession` varchar(255),
	`position` varchar(255),
	`skills` json,
	`interests` json,
	`quote` text,
	`websites` json,
	`socials` json,
	`coping` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `glossary` ADD CONSTRAINT `glossary_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `glossary` ADD CONSTRAINT `glossary_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `room_members` ADD CONSTRAINT `room_members_roomId_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `room_members` ADD CONSTRAINT `room_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_roomId` ON `activity_logs` (`roomId`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `activity_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_action` ON `activity_logs` (`action`);--> statement-breakpoint
CREATE INDEX `idx_createdAt` ON `activity_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_roomId` ON `glossary` (`roomId`);--> statement-breakpoint
CREATE INDEX `idx_createdBy` ON `glossary` (`createdBy`);--> statement-breakpoint
CREATE INDEX `idx_roomId` ON `messages` (`roomId`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `messages` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_createdAt` ON `messages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_roomId` ON `room_members` (`roomId`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `room_members` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_createdBy` ON `rooms` (`createdBy`);--> statement-breakpoint
CREATE INDEX `idx_parentId` ON `rooms` (`parentId`);