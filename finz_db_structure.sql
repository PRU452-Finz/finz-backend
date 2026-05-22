/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.6-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: finz_db
-- ------------------------------------------------------
-- Server version	11.8.6-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `category` enum('makanan','transport','hiburan','belanja','tagihan','pendidikan','kesehatan','lainnya') NOT NULL,
  `limit_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `month` varchar(7) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `budgets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `prediction_logs`
--

DROP TABLE IF EXISTS `prediction_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `prediction_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `input_text` varchar(500) NOT NULL COMMENT 'Teks deskripsi yang di-input user',
  `predicted_category` varchar(50) NOT NULL COMMENT 'Kategori hasil prediksi AI/rule-based',
  `confidence` decimal(3,2) DEFAULT NULL COMMENT 'Skor kepercayaan prediksi (0.00 – 1.00)',
  `model_version` varchar(20) DEFAULT 'rule-v1' COMMENT 'Versi model yang digunakan',
  `user_overridden` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Apakah user mengganti prediksi?',
  `final_category` varchar(50) DEFAULT NULL COMMENT 'Kategori akhir yang dipakai (bisa sama atau beda dengan prediksi)',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `prediction_logs_predicted_category` (`predicted_category`),
  KEY `prediction_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL DEFAULT 1 COMMENT 'ID pengguna pemilik transaksi',
  `amount` decimal(15,2) NOT NULL COMMENT 'Nominal transaksi dalam Rupiah',
  `category` enum('makanan','transport','hiburan','belanja','tagihan','pendidikan','kesehatan','pemasukan','gaji','bonus','investasi','lainnya') NOT NULL COMMENT 'Kategori pengeluaran atau pemasukan',
  `description` varchar(255) NOT NULL DEFAULT '' COMMENT 'Deskripsi singkat transaksi',
  `payment_method` enum('cash','debit','credit','ewallet','transfer','qris') NOT NULL DEFAULT 'cash' COMMENT 'Metode pembayaran',
  `date` date NOT NULL COMMENT 'Tanggal transaksi (YYYY-MM-DD)',
  `created_at` datetime NOT NULL,
  `transaction_type` enum('expense','income') NOT NULL DEFAULT 'expense' COMMENT 'Jenis transaksi: pengeluaran atau pemasukan',
  `hour_of_day` tinyint(3) unsigned DEFAULT NULL COMMENT 'Jam transaksi (0-23), untuk analisis pola waktu',
  `is_recurring` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Apakah transaksi ini berulang setiap bulan?',
  PRIMARY KEY (`id`),
  KEY `transactions_user_id` (`user_id`),
  KEY `transactions_category` (`category`),
  KEY `transactions_date` (`date`),
  KEY `transactions_transaction_type` (`transaction_type`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=259 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `monthly_income` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Pemasukan bulanan user (Rp)',
  `age` int(11) DEFAULT NULL,
  `occupation` enum('mahasiswa','karyawan','freelancer','wirausaha','lainnya') NOT NULL DEFAULT 'karyawan',
  `financial_goal` enum('hemat','investasi','bebas_utang','dana_darurat') NOT NULL DEFAULT 'dana_darurat',
  `risk_profile` enum('konservatif','moderat','agresif') NOT NULL DEFAULT 'konservatif',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `password` varchar(255) NOT NULL COMMENT 'Hashed password (bcrypt)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-05-21  4:25:13
