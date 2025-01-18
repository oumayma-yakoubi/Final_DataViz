import json
import os

# Function to load JSON from a file
def load_json(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return None

# Function to get the list of user files from index.json
def get_user_file_list():
    try:
        return load_json('index.json')
    except Exception as e:
        print(f"Error loading the JSON file: {e}")
        return None

# Function to load user data based on folder and file structure
def load_user_data(user_folder, files):
    base_path = os.path.join('data', user_folder)
    user_data = {
        "user": user_folder,
        "playlists": [],
        "streamingHistory": {
            "music": [],
            "podcast": []
        }
    }

    for file in files:
        file_path = os.path.join(base_path, file)

        if file.startswith('StreamingHistory_music'):
            music_data = load_json(file_path)
            if music_data:
                user_data["streamingHistory"]["music"].extend(music_data)
        elif file.startswith('StreamingHistory_podcast'):
            podcast_data = load_json(file_path)
            if podcast_data:
                user_data["streamingHistory"]["podcast"].extend(podcast_data)
        elif file.startswith('Playlist'):
            playlist_data = load_json(file_path)
            if playlist_data and "playlists" in playlist_data:
                user_data["playlists"].extend(playlist_data["playlists"])
        else:
            file_key = file.replace('.json', '')
            other_data = load_json(file_path)
            if other_data:
                user_data[file_key] = other_data

    return user_data

# Function to load all users' data and combine into a single list
def load_all_users_data():
    file_list = get_user_file_list()
    if not file_list:
        return []

    all_data = []
    for user_folder, files in file_list.items():
        user_data = load_user_data(user_folder, files)
        all_data.append(user_data)

    return all_data

# Main function to process and save the data to data.json
def main():
    all_users_data = load_all_users_data()
    if all_users_data:
        with open('data.json', 'w') as f:
            json.dump(all_users_data, f, indent=4)
    else:
        print("No data to save.")


import json
import os

def merge_user_data_to_single_file(genre_dir="data/genre", output_file="data/genre/merged_genre_data.json"):
    """
    Fusionne les données de genre de plusieurs utilisateurs dans un seul fichier JSON.

    :param genre_dir: Dossier où les fichiers de genre des utilisateurs sont stockés (par défaut 'data/genre').
    :param output_file: Chemin du fichier de sortie où les données combinées seront sauvegardées (par défaut 'data/genre/merged_genre_data.json').
    """
    # Créer un dictionnaire vide pour stocker les données combinées
    merged_data = {}

    # Parcourir tous les fichiers dans le répertoire genre
    for filename in os.listdir(genre_dir):
        if filename.endswith(".json"):  # Assurer que ce sont des fichiers JSON
            file_path = os.path.join(genre_dir, filename)
            try:
                with open(file_path, 'r', encoding='utf-8') as json_file:
                    user_data = json.load(json_file)
                    user_folder = filename.split("_")[1].replace(".json", "")  # Extraire l'identifiant de l'utilisateur
                    merged_data[user_folder] = user_data
                print(f"Les données de {user_folder} ont été chargées avec succès.")
            except Exception as e:
                print(f"Erreur lors de la lecture du fichier {filename}: {e}")

    # Sauvegarder les données combinées dans le fichier de sortie
    try:
        with open(output_file, 'w', encoding='utf-8') as json_output_file:
            json.dump(merged_data, json_output_file, ensure_ascii=False, indent=4)
        print(f"Les données combinées ont été enregistrées dans {output_file}.")
    except Exception as e:
        print(f"Erreur lors de l'enregistrement du fichier combiné: {e}")


# Run the main function
if __name__ == "__main__":
    main()
    # Appel de la fonction pour fusionner les données
    merge_user_data_to_single_file()
