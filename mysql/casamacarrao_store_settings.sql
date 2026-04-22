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
-- Table structure for table `store_settings`
--

DROP TABLE IF EXISTS `store_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_settings` (
  `id` int NOT NULL DEFAULT '1',
  `extraIngredientPrice` decimal(10,2) DEFAULT '3.00',
  `extraCheesePrice` decimal(10,2) DEFAULT '8.00',
  `whatsappMessage` text,
  `registerOpenedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `autoApprove` tinyint(1) DEFAULT '0',
  `extraPastaPrice` decimal(10,2) DEFAULT '0.00',
  `extraSaucePrice` decimal(10,2) DEFAULT '0.00',
  `isOpen` tinyint(1) DEFAULT '1',
  `taxaEmbalagemGlobal` decimal(10,2) DEFAULT '2.00',
  `mercadoPagoAtivo` tinyint(1) DEFAULT '1',
  `taxaCartaoPercentual` decimal(5,2) DEFAULT '3.50',
  `taxaCartaoFixa` decimal(10,2) DEFAULT '0.00',
  `autoApproveMesa` tinyint(1) DEFAULT '0',
  `deliverySchedule` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store_settings`
--

LOCK TABLES `store_settings` WRITE;
/*!40000 ALTER TABLE `store_settings` DISABLE KEYS */;
INSERT INTO `store_settings` VALUES (1,3.00,8.00,'Olá, {{nome}}, recebemos seu pedido!, Acompanhe o status aqui: {{link}} para efetuar pagamento o nosso pix é  22996196206 o seu total é: {{total}}','2026-04-22 18:27:43',0,15.00,10.00,1,2.00,0,5.00,0.00,0,NULL);
/*!40000 ALTER TABLE `store_settings` ENABLE KEYS */;
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
