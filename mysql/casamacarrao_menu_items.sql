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
-- Table structure for table `menu_items`
--

DROP TABLE IF EXISTS `menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_items` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(50) NOT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `price` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_items`
--

LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
INSERT INTO `menu_items` VALUES ('8098c80d-294f-11f1-a3f4-02420a0b1b3a','Penne','pasta',1,0.00),('8098ca6e-294f-11f1-a3f4-02420a0b1b3a','Spaguetti','pasta',1,0.00),('8098cbde-294f-11f1-a3f4-02420a0b1b3a','Talharim','pasta',1,0.00),('8098cc40-294f-11f1-a3f4-02420a0b1b3a','Parafuso','pasta',1,0.00),('8098cc88-294f-11f1-a3f4-02420a0b1b3a','Nhoque tradicional','pasta',1,0.00),('809adf6f-294f-11f1-a3f4-02420a0b1b3a','Tomate','sauce',1,0.00),('809ae1ef-294f-11f1-a3f4-02420a0b1b3a','Bolonhesa','sauce',1,0.00),('809ae256-294f-11f1-a3f4-02420a0b1b3a','Branco','sauce',1,0.00),('809ae292-294f-11f1-a3f4-02420a0b1b3a','Rose','sauce',1,0.00),('809d1764-294f-11f1-a3f4-02420a0b1b3a','Cebolinha','seasoning',1,0.00),('809d19e2-294f-11f1-a3f4-02420a0b1b3a','Manjericão','seasoning',1,0.00),('809d1a43-294f-11f1-a3f4-02420a0b1b3a','Orégano','seasoning',1,0.00),('809d1a7b-294f-11f1-a3f4-02420a0b1b3a','Salsinha','seasoning',1,0.00),('809d1ab5-294f-11f1-a3f4-02420a0b1b3a','Pimenta Calabresa','seasoning',1,0.00),('809d1af0-294f-11f1-a3f4-02420a0b1b3a','Queijo Parmesão','seasoning',1,0.00),('809f67d1-294f-11f1-a3f4-02420a0b1b3a','Alho','ingredient',1,0.00),('809f6a56-294f-11f1-a3f4-02420a0b1b3a','Alcaparras','ingredient',1,0.00),('809f6aad-294f-11f1-a3f4-02420a0b1b3a','Azeitonas Verdes','ingredient',1,0.00),('809f6aeb-294f-11f1-a3f4-02420a0b1b3a','Brócolis','ingredient',1,0.00),('809f6b2d-294f-11f1-a3f4-02420a0b1b3a','Bacon','ingredient',1,0.00),('809f6b65-294f-11f1-a3f4-02420a0b1b3a','Camarão','ingredient',1,0.00),('809f6b9f-294f-11f1-a3f4-02420a0b1b3a','Cebola','ingredient',1,0.00),('809f6bdb-294f-11f1-a3f4-02420a0b1b3a','Champignons','ingredient',1,0.00),('809f6c11-294f-11f1-a3f4-02420a0b1b3a','Ervilha','ingredient',1,0.00),('809f6c49-294f-11f1-a3f4-02420a0b1b3a','Frango','ingredient',1,0.00),('809f6c80-294f-11f1-a3f4-02420a0b1b3a','Calabresa','ingredient',1,0.00),('809f6cb6-294f-11f1-a3f4-02420a0b1b3a','Milho','ingredient',1,0.00),('809f6cee-294f-11f1-a3f4-02420a0b1b3a','Mussarela','ingredient',1,0.00),('809f6d26-294f-11f1-a3f4-02420a0b1b3a','Salaminho','ingredient',1,0.00),('809f6d5d-294f-11f1-a3f4-02420a0b1b3a','Ovo de Codorna','ingredient',1,0.00),('809f6dca-294f-11f1-a3f4-02420a0b1b3a','Passas','ingredient',1,0.00),('809f6e0b-294f-11f1-a3f4-02420a0b1b3a','Peito de peru','ingredient',1,0.00),('809f6e46-294f-11f1-a3f4-02420a0b1b3a','Presunto','ingredient',1,0.00),('809f6e7d-294f-11f1-a3f4-02420a0b1b3a','Queijo minas','ingredient',1,0.00),('809f6eb4-294f-11f1-a3f4-02420a0b1b3a','Tomate','ingredient',1,0.00),('extra-1775669182900','Queijo Extra','extra',1,8.00);
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
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

-- Dump completed on 2026-04-22 15:43:35
