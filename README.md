# MySpotify DataViz

![Image](img/site_overview.gif)

#### Membres du groupe

- Liroulet Inès ines.liroulet@etu.univ-lyon1.fr
- Ridouan Aafaf aafaf.ridouan@etu.univ-lyon1.fr
- Yakoubi Oumayma oumayma.yakoubi@etu.univ-lyon1.fr

## Résumé

Ce projet vise à répondre aux besoins d’analyse et de visualisation des comportements musicaux des utilisateurs de Spotify. Nous cherchons à fournir des outils interactifs permettant aux utilisateurs d’explorer leurs données personnelles, de mieux comprendre leurs habitudes d’écoute, et de découvrir des insights sur leurs préférences musicales, leurs humeurs, et leur comportement de consommation.

Les données utilisées proviennent des historiques Spotify de plusieurs utilisateurs. Ces données ont été obtenues grâce à la fonctionnalité de demande de données personnelles disponible sur Spotify. Afin de garantir une source légitime et fiable, nous avons contacté des amis et obtenu leur consentement explicite pour partager leurs données. Ces fichiers, contenant des informations telles que les chansons écoutées, les artistes favoris, les genres préférés et les horaires d’écoute, ont été téléchargés au format JSON.

Après un délai de cinq jours requis par Spotify pour générer les fichiers, les utilisateurs nous ont transmis ces derniers. Nous avons mis en place un processus de traitement et préparation des données en structurant les informations issues des fichiers JSON (historique, playlists, etc.) pour permettre une utilisation efficace et optimale.

Ce projet met en avant une approche innovante pour offrir des insights musicaux personnalisés, tout en respectant la transparence et la confidentialité des données des utilisateurs.

## Abstract

This project aims to address the needs for analyzing and visualizing Spotify users’ musical behaviors. Our goal is to provide interactive tools that allow users to explore their personal data, better understand their listening habits, and uncover insights into their musical preferences, moods, and consumption patterns.

The data used in this project was sourced from the Spotify listening histories of several users. These datasets were obtained through Spotify’s personal data request feature. To ensure a legitimate and reliable source, we reached out to friends and obtained their explicit consent to share their data. The files, containing information such as songs played, favorite artists, preferred genres, and listening times, were downloaded in JSON format.

After the five-day period required by Spotify to generate the files, users shared the data with us. We implemented a data processing and preparation pipeline to structure the information from the JSON files (history, playlists, etc.) for efficient and optimal use.

This project highlights an innovative approach to delivering personalized musical insights while maintaining transparency and respecting users’ data privacy.

## Questions

- Quels artistes dominent mon univers musical ?
- Quels artistes ont eu le plus d’impact sur mes playlists ?
- Comment mes habitudes d’écoute varient-elles d’un mois à l’autre ?
- Comment mes habitudes d’écoute diffèrent-elles entre le matin, l’après-midi et le soir ?
- Quels genres musicaux représentent mes préférences ?
- Suis-je plus orienté vers la musique ou les récits (podcasts) dans mon quotidien ?
- Quelles sont mes playlists les plus riches en contenu ?


## Visualisations Principales

1. **L'Écosystème de Vos Écoutes**  
   Une carte visuelle qui met en évidence vos artistes les plus écoutés, montrant les points les plus intenses et les piliers de votre année musicale.

2. **Vos Icônes Musicales de l’Année !**  
   Une visualisation où la taille des rectangles reflète l'impact de chaque artiste sur vos playlists. Elle met en lumière vos artistes phares avec des détails interactifs.

3. **Les Minutes Qui Ont Rythmé Vos Mois !**  
   Un graphique chronologique coloré montrant vos habitudes d'écoute minute par minute pour chaque mois, révélant vos pics et creux d'activité musicale.

4. **Ton Cycle Quotidien d'Écoute**  
   Une analyse temporelle illustrant vos habitudes d'écoute au cours de la journée, avec une répartition entre le matin, l’après-midi et le soir.

5. **Le Genre Musical Qui Te Définit**  
   Un diagramme circulaire qui montre la répartition de vos genres musicaux préférés, offrant un aperçu de votre univers sonore.

6. **Ton Équilibre Entre Podcasts et Musique**  
   Une visualisation comparative qui illustre la part de votre temps d'écoute consacrée à la musique et aux podcasts, montrant vos préférences entre ces deux univers.

7. **Top 20 des Playlists les Plus Remplies : Un Océan de Musique**  
   Un classement interactif des playlists contenant le plus de chansons, avec des filtres pour explorer l’évolution de leur contenu au fil des mois.


   ## Technologies 

* **D3.js** : (ou D3 pour Data-Driven Documents) est une bibliothèque graphique JavaScript qui permet l'affichage de données numériques sous une forme graphique et dynamique. Il s'agit d'un outil important pour la conformation aux normes W3C qui utilise les technologies courantes SVG, JavaScript et CSS pour la visualisation de données.
* **HTML** : Le HyperText Markup Language, généralement abrégé HTML ou, dans sa dernière version, HTML5, est le langage de balisage conçu pour écrire les pages web.
* **CSS** : (Cascading Style Sheets) permet de créer des pages web à l'apparence soignée.
* **GitHub** : pour la gestion des versions

#### Note:
Lors de la réalisation de ce projet, nous nous sommes principalement appuyés sur la documentation de D3. La première visualisation est directement inspirée d’un exemple issu de cette documentation. Nous avons également utilisé ChatGPT pour nous assister dans l’exploitation du langage D3, tout en restant attentifs aux éventuelles erreurs générées par cet outil.


#### Liens Important

Pour accéder à au site web, [cliquez ici...](https://oumayma-yakoubi.github.io/MySpotifyDataViz/)

Master 2 Intelligence Artficielle [Cours visualisation interactive de données](https://lyondataviz.github.io/teaching/lyon1-m2/2024/)
