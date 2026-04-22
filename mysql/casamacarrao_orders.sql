-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: 136.248.87.149    Database: casamacarrao
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '2a0c4163-294c-11f1-ba89-02420a0b1b33:1-1642';

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` varchar(36) NOT NULL,
  `customerName` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `address` text NOT NULL,
  `paymentMethod` varchar(50) NOT NULL,
  `status` varchar(50) DEFAULT 'aprovado',
  `isPaid` tinyint(1) DEFAULT '0',
  `total` decimal(10,2) NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `isAccounted` tinyint(1) DEFAULT '0',
  `items` json NOT NULL,
  `products` json DEFAULT NULL,
  `observation` text,
  `deliveredAt` datetime DEFAULT NULL,
  `tipoPedido` varchar(20) DEFAULT 'delivery',
  `taxaEntrega` decimal(10,2) DEFAULT '0.00',
  `taxaEmbalagem` decimal(10,2) DEFAULT '0.00',
  `taxaCartao` decimal(10,2) DEFAULT '0.00',
  `subtotal` decimal(10,2) DEFAULT '0.00',
  `impresso` tinyint(1) DEFAULT '0',
  `approvedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES ('0489c9c5-0a60-485c-8f7a-295a13807282','asd','asd','asd, Nº 12 - centro, ','pix','entregue',1,12.50,'2026-04-22 17:35:46',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asd','2026-04-22 14:52:24','delivery',6.00,0.00,0.00,6.50,1,'2026-04-22 14:35:46'),('0fd8c060-6301-4f08-a35b-f802189e4093','asd123123','asd','asdas11235644415, Nº 15 - centro, ','pix','entregue',1,62.40,'2026-04-22 16:59:45',1,'[{\"id\": \"550f5e52-b34d-4570-a7a2-bba6a2ca0965\", \"extras\": [\"extra-1775669182900\"], \"sauces\": [\"809ae1ef-294f-11f1-a3f4-02420a0b1b3a\", \"809ae256-294f-11f1-a3f4-02420a0b1b3a\"], \"sizeId\": \"g\", \"pastaId\": \"8098cbde-294f-11f1-a3f4-02420a0b1b3a\", \"temperos\": [], \"ingredients\": [\"809f6bdb-294f-11f1-a3f4-02420a0b1b3a\", \"809f6c11-294f-11f1-a3f4-02420a0b1b3a\", \"809f6b65-294f-11f1-a3f4-02420a0b1b3a\"]}]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','12123321','2026-04-22 14:04:34','delivery',1.00,2.00,0.00,59.40,0,'2026-04-22 13:59:45'),('150c8d72-02f5-4cf2-aa33-cbeb084b8e99','asd','2620','asd, Nº 123 - centro, ','pix','entregue',1,12.50,'2026-04-22 17:26:53',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asd','2026-04-22 14:27:08','delivery',6.00,0.00,0.00,6.50,0,'2026-04-22 14:26:54'),('26983fba-9687-4203-a6d9-d08e52053006','asd','Não informado','Mesa 02','dinheiro','entregue',1,6.50,'2026-04-22 17:53:25',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asd','2026-04-22 14:54:02','delivery',0.00,0.00,0.00,0.00,1,'2026-04-22 14:54:00'),('309a3b65-f706-4664-83e1-3898eca1d35a','asd','Não informado','Mesa 02','dinheiro','entregue',1,6.50,'2026-04-22 17:43:44',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asdas','2026-04-22 14:43:54','delivery',0.00,0.00,0.00,0.00,1,'2026-04-22 14:43:48'),('4ef04cb4-e51e-4380-aba9-e90ab3475229','asdas','dasd','asdas1, Nº 23 - centro, ','pix','entregue',1,18.50,'2026-04-22 17:50:50',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}, {\"quantity\": 1, \"productId\": \"47b51851-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asd','2026-04-22 14:52:26','delivery',6.00,0.00,0.00,12.50,1,'2026-04-22 17:50:51'),('5aced2ca-2d7d-4b0c-8198-2bc80c6e79a1','dasdasd','Não informado','Mesa 02','dinheiro','entregue',1,4.00,'2026-04-22 17:44:15',1,'[]','[{\"quantity\": 1, \"productId\": \"47b51984-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asdasd','2026-04-22 14:44:27','delivery',0.00,0.00,0.00,0.00,1,'2026-04-22 14:44:18'),('62cdb3f3-d0f5-49bd-b20b-dbf7ea652511','asdas','Não informado','Mesa 01','dinheiro','entregue',1,6.50,'2026-04-22 17:45:37',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','dasd','2026-04-22 17:46:34','delivery',0.00,0.00,0.00,0.00,1,'2026-04-22 17:46:08'),('73ad529c-e8c4-4d9c-b6e9-99c830bb553d','asd','asd','asdasd, Nº 10 - centro, ','pix','entregue',1,12.50,'2026-04-22 17:09:47',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','','2026-04-22 14:10:05','delivery',6.00,0.00,0.00,6.50,0,'2026-04-22 14:09:48'),('7fe99b32-6872-4650-835a-c6f24f01cfbb','asd1q234','ad4254','aa, Nº 2 - Areal, ','pix','entregue',1,18.50,'2026-04-22 17:06:45',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}, {\"quantity\": 1, \"productId\": \"47b51851-2d3b-11f1-a3f4-02420a0b1b3a\"}]','344rrtfg54r5','2026-04-22 14:07:13','delivery',6.00,0.00,0.00,12.50,0,'2026-04-22 14:06:46'),('8a06235c-2d09-4dab-ad7b-a0e414db220e','asd','das','asd, Nº 12 - centro, ','pix','entregue',1,12.00,'2026-04-22 17:35:09',1,'[]','[{\"quantity\": 1, \"productId\": \"47b51851-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asdasd','2026-04-22 14:52:19','delivery',6.00,0.00,0.00,6.00,1,'2026-04-22 14:35:09'),('8c6402be-ac80-4491-8919-cd92236d50b1','asd','asd','asd, Nº 123 - centro, ','pix','entregue',1,12.50,'2026-04-22 17:54:30',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asdasd','2026-04-22 17:55:15','delivery',6.00,0.00,0.00,6.50,1,'2026-04-22 17:54:43'),('9742b019-f71b-4fd3-9848-9ef07f5a94dc','asdasd','Não informado','Mesa 01','dinheiro','entregue',1,6.50,'2026-04-22 17:50:19',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asd','2026-04-22 14:53:01','delivery',0.00,0.00,0.00,0.00,1,'2026-04-22 14:52:52'),('9e37e19d-a46a-4061-b4dd-d78a902f861c','asd123','Não informado','Mesa 02','dinheiro','entregue',1,6.50,'2026-04-22 16:04:33',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asdasd','2026-04-22 13:08:00','delivery',0.00,0.00,0.00,0.00,1,'2026-04-22 13:07:55'),('abf6a62c-09a2-4bc8-93de-569510b6953f','asdasdas','Não informado','Mesa 02','dinheiro','novo',0,13.00,'2026-04-22 17:59:55',0,'[]','[{\"quantity\": 2, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','dasd',NULL,'delivery',0.00,0.00,0.00,0.00,0,NULL),('b584cee2-c1e8-4894-ad88-abe1c7c66d82','asd','Não informado','Mesa 01','dinheiro','entregue',1,6.50,'2026-04-22 17:57:04',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asd','2026-04-22 17:57:17','delivery',0.00,0.00,0.00,0.00,0,NULL),('c3f8a836-dff6-4d65-a502-3eebfe4ccd3e','sdasdasdasd','asdasdas','asd, Nº 123 - XV de Novembro, ','pix','entregue',1,18.50,'2026-04-22 16:09:31',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}, {\"quantity\": 1, \"productId\": \"47b51111-2d3b-11f1-a3f4-02420a0b1b3a\"}]','ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312ASDDDDDDDDD212312','2026-04-22 13:15:08','delivery',0.00,0.00,0.00,0.00,1,'2026-04-22 13:09:31'),('c5556cc3-2d98-47a0-8eba-e6faebea3eae','asd','asd','asd, Nº 12 - centro, ','pix','entregue',1,12.50,'2026-04-22 17:41:51',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','','2026-04-22 14:52:22','delivery',6.00,0.00,0.00,6.50,1,'2026-04-22 14:41:51'),('d5f4b5c6-2589-4dfc-b3c9-2ccbb99d9bbb','Leonardo Raposo Boechat','22992082292','Rua campos de Paz, Nº 8 - Areal, ','pix','aprovado',0,102.90,'2026-04-22 18:03:22',0,'[{\"id\": \"4a1c6d40-0cbe-4924-8a44-acb5fa5a581a\", \"extras\": [\"extra-1775669182900\"], \"sauces\": [\"809ae256-294f-11f1-a3f4-02420a0b1b3a\", \"809ae1ef-294f-11f1-a3f4-02420a0b1b3a\", \"809adf6f-294f-11f1-a3f4-02420a0b1b3a\"], \"sizeId\": \"g\", \"pastaId\": \"8098cbde-294f-11f1-a3f4-02420a0b1b3a\", \"temperos\": [\"809d1a43-294f-11f1-a3f4-02420a0b1b3a\", \"809d1af0-294f-11f1-a3f4-02420a0b1b3a\", \"809d1ab5-294f-11f1-a3f4-02420a0b1b3a\", \"809d19e2-294f-11f1-a3f4-02420a0b1b3a\", \"809d1764-294f-11f1-a3f4-02420a0b1b3a\", \"809d1a7b-294f-11f1-a3f4-02420a0b1b3a\"], \"ingredients\": [\"809f6a56-294f-11f1-a3f4-02420a0b1b3a\", \"809f6aad-294f-11f1-a3f4-02420a0b1b3a\", \"809f6b65-294f-11f1-a3f4-02420a0b1b3a\", \"809f6b2d-294f-11f1-a3f4-02420a0b1b3a\", \"809f6bdb-294f-11f1-a3f4-02420a0b1b3a\", \"809f6c11-294f-11f1-a3f4-02420a0b1b3a\", \"809f6cb6-294f-11f1-a3f4-02420a0b1b3a\", \"809f6c80-294f-11f1-a3f4-02420a0b1b3a\", \"809f6d5d-294f-11f1-a3f4-02420a0b1b3a\", \"809f6e46-294f-11f1-a3f4-02420a0b1b3a\", \"809f6eb4-294f-11f1-a3f4-02420a0b1b3a\", \"809f6e0b-294f-11f1-a3f4-02420a0b1b3a\", \"809f6d26-294f-11f1-a3f4-02420a0b1b3a\", \"809f6cee-294f-11f1-a3f4-02420a0b1b3a\", \"809f6dca-294f-11f1-a3f4-02420a0b1b3a\", \"809f6e7d-294f-11f1-a3f4-02420a0b1b3a\", \"809f6c49-294f-11f1-a3f4-02420a0b1b3a\", \"809f6b9f-294f-11f1-a3f4-02420a0b1b3a\", \"809f6aeb-294f-11f1-a3f4-02420a0b1b3a\", \"809f67d1-294f-11f1-a3f4-02420a0b1b3a\"]}]','[{\"quantity\": 2, \"productId\": \"47b51851-2d3b-11f1-a3f4-02420a0b1b3a\"}]','Troco para 100',NULL,'delivery',6.00,2.00,0.00,94.90,1,'2026-04-22 18:03:37'),('f01df82a-c285-444d-925c-92e727a93bee','das','Não informado','Mesa 02','dinheiro','entregue',1,13.50,'2026-04-22 17:13:11',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}, {\"quantity\": 1, \"productId\": \"47b51111-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asdasd','2026-04-22 14:13:57','delivery',0.00,0.00,0.00,0.00,0,'2026-04-22 14:13:56'),('f2a565d1-9775-49bf-9035-dda9680fc1f4','asdasd','Não informado','Mesa 02','dinheiro','entregue',1,6.50,'2026-04-22 17:28:29',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asdasd','2026-04-22 14:30:10','delivery',0.00,0.00,0.00,0.00,0,'2026-04-22 14:30:07'),('f93290a7-f8aa-441d-b58e-6931ecbefac7','dasd','asd','asd, Nº 123 - centro, ','pix','entregue',1,12.50,'2026-04-22 17:52:08',1,'[]','[{\"quantity\": 1, \"productId\": \"47b515e9-2d3b-11f1-a3f4-02420a0b1b3a\"}]','asdasdsad','2026-04-22 17:55:17','delivery',6.00,0.00,0.00,6.50,1,'2026-04-22 17:54:40');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-22 15:43:38
