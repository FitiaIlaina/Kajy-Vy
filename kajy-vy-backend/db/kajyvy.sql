-- phpMyAdmin SQL Dump
-- version 5.0.4
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mer. 07 jan. 2026 à 09:32
-- Version du serveur :  10.4.17-MariaDB
-- Version de PHP : 8.0.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `kajyvy`
--

-- --------------------------------------------------------

--
-- Structure de la table `administrateur`
--

CREATE TABLE `administrateur` (
  `id_admin` int(5) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `surname` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `administrateur`
--

INSERT INTO `administrateur` (`id_admin`, `email`, `name`, `surname`, `password`, `role`) VALUES
(1, 'ilainafitia@gmail.com', 'fitia', 'ilaina', '$2b$12$f.top7i9kWDuL04nWThBM.pSP6sBONTt690N1MFG7JRCjZIsC1EM6', 'admin'),
(2, 'faly@gmail.com', 'fa', 'ly', '$2b$12$3OajveweJRxqsFb80CeJu.WJ4tABv6XWyz4bqgBK2WoK5X1VLiL1i', 'admin'),
(3, 'ilainafitia@icloud.com', 'Ila', 'Ina', '$2b$12$AMEut.E/XM.LODdp9i289uIG1BTwcH9juU7UWxuhEgcYfNshz.JC2', 'admin'),
(4, 'mahatokyarinofy@gmail.com', 'Arinofy', 'Mahatoky', '$2b$12$CUUH6NsQY.Kt9.YpZD8E/./kHXcVQxTXZwZBVWN8HC1f9NBt.cm5u', 'admin'),
(5, 'motar@gmail.com', 'Motar', 'Motar', '$2b$12$XEXscHSZ/CFeKbjXkSv5aeNMixNh8jIQ48UcG4RLoW9oGnJSTt4zy', 'admin'),
(6, 'avo@gmail.com', 'avo', 'avo', '$2b$12$Ok0rTx1ACN5N.IcidmdCQusf53pKD4ZA2LVIwGzLamWQeXrj5LxI.', 'admin'),
(7, 'ilaina@gmail.com', 'Fitia', 'Ilaina', '$2b$12$Bm0h2e0CIulFDRmcpKSjAu0FmdwWo2miaPLNjQm0N3eqMrAvEsUoG', 'admin'),
(8, 'fandriamalala3@gmail.com', 'Rak', 'Rakito', '$2b$12$JbOaVLpmR0asO2iBBdOIbezw1qOhRdr0q/6rv50lU9Fv/G7o8OFg2', 'admin');

-- --------------------------------------------------------

--
-- Structure de la table `bati`
--

CREATE TABLE `bati` (
  `id_bati` int(5) NOT NULL,
  `type_bati` varchar(255) NOT NULL,
  `prix_peinture` decimal(10,2) NOT NULL,
  `prix_type` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `bati`
--

INSERT INTO `bati` (`id_bati`, `type_bati`, `prix_peinture`, `prix_type`) VALUES
(1, 'Fer cornière 20 - 2,5', '2400.00', '30000.00'),
(2, 'Fer cornière 25 - 2,5', '3000.00', '35000.00'),
(3, 'Fer cornière 30 - 2,5', '3500.00', '42500.00'),
(4, 'Fer cornière 35 - 2,5', '4100.00', '50000.00'),
(5, 'Fer cornière 20 - 3', '2400.00', '35000.00'),
(6, 'Fer cornière 25 - 3', '3000.00', '40000.00'),
(7, 'Fer cornière 30 - 3', '3500.00', '52500.00'),
(8, 'Fer cornière 35 - 3', '4100.00', '60000.00'),
(9, 'Fer cornière 25 - 4', '3000.00', '60000.00'),
(10, 'Fer cornière 30 - 4', '3500.00', '72500.00'),
(11, 'Fer cornière 40 - 4', '4700.00', '90000.00');

-- --------------------------------------------------------

--
-- Structure de la table `cadre`
--

CREATE TABLE `cadre` (
  `id_cadre` int(5) NOT NULL,
  `type_cadre` varchar(255) NOT NULL,
  `prix_peinture` decimal(10,2) NOT NULL,
  `prix_type` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `cadre`
--

INSERT INTO `cadre` (`id_cadre`, `type_cadre`, `prix_peinture`, `prix_type`) VALUES
(1, 'Tube rectangle 30x20 - 1,2', '2900.00', '35000.00'),
(2, 'Tube rectangle 30x40 - 1,2', '4100.00', '47500.00'),
(3, 'Tube rectangle 40x20 - 1,2', '3500.00', '40000.00'),
(4, 'Tube rectangle 50x30 - 1,2', '4700.00', '55000.00'),
(5, 'Tube rectangle 40x30 - 1,5', '4100.00', '70000.00'),
(6, 'Tube rectangle 50x30 - 1,5', '4700.00', '72500.00'),
(7, 'Tube rectangle 60x30 - 1,5', '5300.00', '85000.00');

-- --------------------------------------------------------

--
-- Structure de la table `cadre_grille`
--

CREATE TABLE `cadre_grille` (
  `id_grille` int(5) NOT NULL,
  `type_cadre` varchar(255) NOT NULL,
  `prix_peinture` decimal(10,2) NOT NULL,
  `prix_type` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `cadre_grille`
--

INSERT INTO `cadre_grille` (`id_grille`, `type_cadre`, `prix_peinture`, `prix_type`) VALUES
(1, 'Tube carré 16 - 1,2', '1900.00', '22000.00'),
(2, 'Tube carré 20 - 1,2', '2400.00', '30000.00'),
(3, 'Tube carré 25 - 1,2', '3000.00', '35000.00'),
(4, 'Tube carré 30 - 1,2', '3500.00', '40000.00'),
(5, 'Tube carré 40 - 1,2', '4700.00', '60000.00'),
(6, 'Tube carré 25 - 1,5', '2000.00', '45000.00'),
(7, 'Tube carré 30 - 1,5', '2000.00', '55000.00'),
(8, 'Tube carré 40 - 1,5', '2000.00', '70000.00');

-- --------------------------------------------------------

--
-- Structure de la table `consommables`
--

CREATE TABLE `consommables` (
  `id_cons` int(5) NOT NULL,
  `nom_cons` varchar(255) NOT NULL,
  `prix_cons` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `consommables`
--

INSERT INTO `consommables` (`id_cons`, `nom_cons`, `prix_cons`) VALUES
(1, 'Electrode', '200.00'),
(2, 'Disque ebarbeuse', '4500.00'),
(3, 'Disque Tronçoneuse', '4500.00');

-- --------------------------------------------------------

--
-- Structure de la table `decoration`
--

CREATE TABLE `decoration` (
  `id_decoration` int(5) NOT NULL,
  `type_decoration` varchar(255) NOT NULL,
  `prix_peinture` decimal(10,2) NOT NULL,
  `prix_type` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `decoration`
--

INSERT INTO `decoration` (`id_decoration`, `type_decoration`, `prix_peinture`, `prix_type`) VALUES
(1, 'Fer plat 16 - 2,5', '1000.00', '14000.00'),
(2, 'Fer plat 20 - 2,5', '1200.00', '17000.00'),
(3, 'Fer plat 25 - 2,5', '1500.00', '22000.00'),
(4, 'Fer plat 16 - 3', '1000.00', '16000.00'),
(5, 'Fer plat 20 - 3', '1200.00', '20000.00'),
(6, 'Fer plat 25 - 3', '1500.00', '25000.00'),
(7, 'Fer plat 16 - 4', '1000.00', '24000.00'),
(8, 'Fer plat 20 - 4', '1200.00', '24000.00'),
(9, 'Fer plat 25 - 4', '1500.00', '30000.00'),
(10, 'Tube rond 16 - 1,2', '1500.00', '18000.00'),
(11, 'Tube rond 25 - 1,2', '2300.00', '32500.00'),
(12, 'Tube rond 30 - 1,2', '2800.00', '32000.00'),
(13, 'Tube rond 40 - 1,2', '3700.00', '40000.00'),
(14, 'Fer rond 6', '1000.00', '20000.00'),
(15, 'Fer rond 8', '1200.00', '20000.00'),
(16, 'Fer rond 10', '1000.00', '20000.00'),
(17, 'Fer rond 12', '1200.00', '20000.00'),
(18, 'Fer carré 8', '1000.00', '22000.00'),
(19, 'Fer carré 10', '1200.00', '35000.00'),
(20, 'Fer carré 12', '1400.00', '45000.00');

-- --------------------------------------------------------

--
-- Structure de la table `tole`
--

CREATE TABLE `tole` (
  `id_tole` int(5) NOT NULL,
  `type_tole` varchar(255) NOT NULL,
  `prix_peinture` decimal(10,2) NOT NULL,
  `prix_type` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `tole`
--

INSERT INTO `tole` (`id_tole`, `type_tole`, `prix_peinture`, `prix_type`) VALUES
(1, 'Tôle 8/10', '20000.00', '90000.00'),
(2, 'Tôle 10/10', '20000.00', '130000.00'),
(3, 'Tôle 12/10', '20000.00', '150000.00');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

CREATE TABLE `utilisateurs` (
  `id_user` int(5) NOT NULL,
  `name` varchar(255) NOT NULL,
  `surname` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Déchargement des données de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id_user`, `name`, `surname`, `email`, `password`) VALUES
(1, 'Fitia Ilaina', 'Andriamalala', 'ilainafitia@gmail.com', '$2b$12$bpo/YzX/AH9jqdeMwkkohuqEnY2p3Q9MVTRXUtslNaNE.nmbfwxVC'),
(2, 'Sahala', 'Fitia', 'sahala@gmail.com', '$2b$12$OOY9j1RChJyQ2Zr3gNpE9OEaktIOb7t3kjXJDxty9.IIDax1xfx8q'),
(3, 'Rakotomalala', 'Mahatoky Arinofy', 'mahatokyarinofy@gmail.com', '$2b$12$mEw/hROBqWosq9rEZiltie.md8AXf87rawIO9u/f2pCIWDK7xTBqS'),
(6, 'Rakotoarinelina', 'Solontiana', 'solo@gmail.com', '$2b$12$AJ9HDoAWtLZAYbcCJEyp7e3obc22CqG4baNMVScS0vc.HuD75VQjG'),
(10, 'Ramiarambola', 'Fanomezantsoa', 'ram@gmail.com', 'iiiiii'),
(15, 'Moctar', 'Tar', 'moctar@gmail.com', '$2b$12$Xv/nzvloOXuOEKVaG6keOOlpAVbiCdvAksDGW3AmKktympLbU3sTe'),
(16, 'aro', 'aro', 'aro@gmail.com', '$2b$12$JV4zgPwvmE.xWdsSB8LztOyv6w5TxetRsVMHuEKJUUnjDFmWPWA8G');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `administrateur`
--
ALTER TABLE `administrateur`
  ADD PRIMARY KEY (`id_admin`);

--
-- Index pour la table `bati`
--
ALTER TABLE `bati`
  ADD PRIMARY KEY (`id_bati`);

--
-- Index pour la table `cadre`
--
ALTER TABLE `cadre`
  ADD PRIMARY KEY (`id_cadre`);

--
-- Index pour la table `cadre_grille`
--
ALTER TABLE `cadre_grille`
  ADD PRIMARY KEY (`id_grille`);

--
-- Index pour la table `consommables`
--
ALTER TABLE `consommables`
  ADD PRIMARY KEY (`id_cons`);

--
-- Index pour la table `decoration`
--
ALTER TABLE `decoration`
  ADD PRIMARY KEY (`id_decoration`);

--
-- Index pour la table `tole`
--
ALTER TABLE `tole`
  ADD PRIMARY KEY (`id_tole`);

--
-- Index pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD PRIMARY KEY (`id_user`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `administrateur`
--
ALTER TABLE `administrateur`
  MODIFY `id_admin` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `bati`
--
ALTER TABLE `bati`
  MODIFY `id_bati` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `cadre`
--
ALTER TABLE `cadre`
  MODIFY `id_cadre` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT pour la table `cadre_grille`
--
ALTER TABLE `cadre_grille`
  MODIFY `id_grille` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `consommables`
--
ALTER TABLE `consommables`
  MODIFY `id_cons` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `decoration`
--
ALTER TABLE `decoration`
  MODIFY `id_decoration` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT pour la table `tole`
--
ALTER TABLE `tole`
  MODIFY `id_tole` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  MODIFY `id_user` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
