async function populateUserSelect() {
    try {
        const allData = await loadAllUsersData(); // Charger les données des utilisateurs
        const userDropdownMenu = document.getElementById("userDropdownMenu"); // Récupérer l'élément du menu dropdown

        // Réinitialiser le contenu existant du menu dropdown
        userDropdownMenu.innerHTML = '';

        // Ajouter chaque utilisateur au menu
        allData.forEach((user, index) => {
            const listItem = document.createElement("li"); // Créer un élément <li>
            const linkItem = document.createElement("a"); // Créer un élément <a>
            linkItem.className = "dropdown-item"; // Classe Bootstrap pour les items
            linkItem.href = "#"; // Lien vide, peut être modifié si nécessaire
            linkItem.textContent = user.user; // Texte à afficher
            linkItem.setAttribute("data-index", index);  // Ajout de l'index comme attribut

            // Ajouter un gestionnaire d'événements au clic
            linkItem.addEventListener("click", () => {
                console.log(`Utilisateur sélectionné : ${user.user} (Index: ${index})`);
                // Ajoutez ici la logique pour gérer la sélection de l'utilisateur
            });

            listItem.appendChild(linkItem); // Ajouter le lien au <li>
            userDropdownMenu.appendChild(listItem); // Ajouter le <li> au menu dropdown
        });

        console.log("Menu déroulant rempli avec succès !");
    } catch (error) {
        console.error("Erreur lors du remplissage du menu déroulant :", error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await populateUserSelect(); // Charge et affiche les utilisateurs au chargement de la page
});

async function onUserSelect(event) {
    
    const allData = await loadAllUsersData();
    const selectedIndex = event.target.getAttribute("data-index");

    if (selectedIndex !== ""){
        const user_data = allData[selectedIndex]; // Obtenir les données de l'utilisateur
        console.log("---------------------------", user_data.user);
        console.log("---------------------------", user_data);

        const genreData = await loadGenreData(user_data.user);
        
        // Call visualizations
        await visualizePlaylists(user_data);
        await ecoutesChart(user_data);
        
        // Pass a callback to visualizeMonthlyListening to link both ecoutesChart and plotTopArtistsTreemap
        await visualizeMonthlyListening(user_data, (selectedMonth) => {
            ecoutesChart(user_data, selectedMonth);
            plotTopArtistsTreemap(user_data, selectedMonth);
        });

        await plotTopArtistsTreemap(user_data);
        await plotGenrePieChart(genreData);
        await visualizeTopSearchQueries(user_data);
        await plotPodcastMusicChart(user_data);
        await artistDensityChart(user_data);

        
    } else {
        document.getElementById("playlist-chart").innerHTML = "";
    }
}


populateUserSelect();

document.getElementById("userDropdownMenu").addEventListener("click", onUserSelect);


// **************************
// ********* Slot 1 *********
// **************************

// Visualize the playlists

async function visualizePlaylists(userData) {
    // Define the number of top playlists to display
    const topN = 20; // Change this value to adjust the number of playlists displayed

    // Process playlists into data and take the top N
    const playlistData = userData.playlists
        .map(playlist => {
            const name = playlist.name || "Untitled Playlist";
            const itemCount = Array.isArray(playlist.items) ? playlist.items.length : 0;
            return { name: name, count: itemCount };
        })
        .sort((a, b) => b.count - a.count) // Sort by count descending
        .slice(0, topN); // Take only the top N playlists

    const width = 500;
    const height = 300; 
    const margin = { top: 20, right: 20, bottom: 50, left: 50 };

    // Clear old content
    d3.select("#playlist-chart").selectAll("*").remove();

    const svg = d3.select("#playlist-chart")
                  .append("svg")
                  .attr("width", width)
                  .attr("height", height);

    const xScale = d3.scaleBand()
                     .domain(playlistData.map(d => d.name))
                     .range([margin.left, width - margin.right])
                     .padding(0.2);

    const yScale = d3.scaleLinear()
                     .domain([0, d3.max(playlistData, d => d.count)])
                     .range([height - margin.bottom, margin.top]);

    // Append x-axis
    const xAxis = svg.append("g")
                     .attr("transform", `translate(0, ${height - margin.bottom})`)
                     .call(d3.axisBottom(xScale));

    xAxis.selectAll("text")
         .style("text-anchor", "end")
         .attr("transform", "rotate(-90)")
         .attr("x", -10)
         .attr("y", 0)
         .attr("dy", "0.35em");

    // Append y-axis
    svg.append("g")
       .attr("transform", `translate(${margin.left}, 0)`)
       .call(d3.axisLeft(yScale));

    const tooltip = d3.select("#tooltip");

    // Create bars
    svg.selectAll(".bar")
       .data(playlistData)
       .enter()
       .append("rect")
       .attr("class", "bar")
       .attr("x", d => xScale(d.name))
       .attr("y", d => yScale(d.count))
       .attr("width", xScale.bandwidth())
       .attr("height", d => height - margin.bottom - yScale(d.count))
       .attr("fill", "steelblue")
       .on("mouseover", (event, d) => {
           tooltip.style("opacity", 1)
                  .html(`Playlist: ${d.name}<br>Items: ${d.count}`);
       })
       .on("mousemove", (event) => {
           tooltip.style("left", (event.pageX + 10) + "px")
                  .style("top", (event.pageY - 20) + "px");
       })
       .on("mouseout", () => {
           tooltip.style("opacity", 0);
       });

    // Message for no data
    if (playlistData.length === 0) {
        svg.append("text")
           .attr("x", width / 2)
           .attr("y", height / 2)
           .attr("text-anchor", "middle")
           .style("font-size", "14px")
           .style("fill", "gray")
           .text("No playlists available");
    }
}

// **************************
// ********* Slot 2 *********
// **************************

// Top serach queries history

async function visualizeTopSearchQueries(userData) {
    // Extract the search queries from the user data
    const searchQueries = userData.SearchQueries;

    // Count the frequency of each search term
    const searchCount = {};

    searchQueries.forEach(entry => {
        const term = entry.searchQuery.trim().toLowerCase(); // Normalize the search term
        if (term && term.length >= 3) { // Only consider terms with 3+ characters
            searchCount[term] = (searchCount[term] || 0) + 1;
        }
    });

    // Convert the searchCount object to an array of {term, count} pairs
    const searchData = Object.entries(searchCount)
                             .map(([term, count]) => ({ term, count }))
                             .sort((a, b) => b.count - a.count);  // Sort by count in descending order

    // Get the top 15 most frequent search terms
    const topSearchData = searchData.slice(0, 15);

    // Set up the dimensions for the bar chart
    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 50, left: 50 };

    // Effacer l'ancien contenu de la div
    d3.select("#top15Searches").selectAll("*").remove();

    // Create the SVG element for the bar chart
    const svg = d3.select("#top15Searches")
                  .append("svg")
                  .attr("width", width)
                  .attr("height", height);

    // Set up the x and y scales
    const xScale = d3.scaleBand()
                     .domain(topSearchData.map(d => d.term))
                     .range([margin.left, width - margin.right])
                     .padding(0.2);

    const yScale = d3.scaleLinear()
                     .domain([0, d3.max(topSearchData, d => d.count)])
                     .nice()  // Adjust the range for better fit
                     .range([height - margin.bottom, margin.top]);

    // Append the x and y axes
    svg.append("g")
       .attr("transform", `translate(0, ${height - margin.bottom})`)
       .call(d3.axisBottom(xScale))
       .selectAll("text")
       .attr("transform", "rotate(-45)")
       .attr("x", -10) // Adjust horizontal position
       .style("text-anchor", "end");  // Rotate x-axis labels for readability

    svg.append("g")
       .attr("transform", `translate(${margin.left}, 0)`)
       .call(d3.axisLeft(yScale));

    // Create the bars for the bar chart
    const tooltip = d3.select("#tooltip");

    svg.selectAll(".bar")
       .data(topSearchData)
       .enter()
       .append("rect")
       .attr("class", "bar")
       .attr("x", d => xScale(d.term))
       .attr("y", d => yScale(d.count))
       .attr("width", xScale.bandwidth())
       .attr("height", d => height - margin.bottom - yScale(d.count))
       .attr("fill", "steelblue")
       .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1)
                   .html(`Search Term: ${d.term}<br>Count: ${d.count}`);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        });
}


// **************************
// ********* Slot 3 *********
// **************************

// Listening time distribution

async function ecoutesChart(userData, month = null) {
    if (!userData.streamingHistory || !Array.isArray(userData.streamingHistory.music)) {
        console.error("streamingHistory or music is missing for this user.");
        return;
    }

    const filteredData = month
        ? userData.streamingHistory.music.filter(entry => {
            const entryDate = new Date(entry.endTime);
            const entryMonth = entryDate.toLocaleString('default', { month: 'short' });
            return entryMonth === month;
        })
        : userData.streamingHistory.music;

    const periodes = [
        { start: 0, end: 3, label: "Midnight - 3 AM" },
        { start: 3, end: 6, label: "3 AM - 6 AM" },
        { start: 6, end: 9, label: "6 AM - 9 AM" },
        { start: 9, end: 12, label: "9 AM - 12 PM" },
        { start: 12, end: 18, label: "12 PM - 6 PM" },
        { start: 18, end: 24, label: "6 PM - Midnight" }
    ];

    const getHour = (dateString) => {
        const [date, time] = dateString.split(' ');
        const [hour] = time.split(':');
        return parseInt(hour, 10);
    };

    const moyennesEcoute = periodes.map(period => {
        const ecoutes = filteredData.filter(entry => {
            const heure = getHour(entry.endTime);
            return heure >= period.start && heure < period.end;
        });

        const totalMs = ecoutes.reduce((sum, entry) => sum + entry.msPlayed, 0);
        return ecoutes.length ? (totalMs / ecoutes.length) / 1000 : 0;
    });

    const width = 600;
    const height = 400;
    const margin = { top: 30, right: 30, bottom: 60, left: 70 };

    d3.select("#ecoutesChart").selectAll("*").remove();

    const svg = d3.select("#ecoutesChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand()
        .domain(periodes.map(p => p.label))
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(moyennesEcoute)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    const tooltip = d3.select("#tooltip");

    svg.selectAll(".bar")
        .data(moyennesEcoute)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (_, i) => x(periodes[i].label))
        .attr("y", d => y(d))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.bottom - y(d))
        .attr("fill", "steelblue")
        .on("mouseover", function (event, d) {
            const index = d3.select(this).datum();
            const i = moyennesEcoute.indexOf(index);

            tooltip.style("opacity", 1)
                .html(`Period: ${periodes[i].label}<br>Average Listening Time: ${d.toFixed(2)} seconds`);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        });
}

// **************************
// ********* Test *********
// **************************





// **************************
// ********* Slot 4 *********
// **************************

// Visualize the total listening time per month (Line chart)

async function visualizeMonthlyListening(userData, updateTimeDistribution) {
    const musicData = userData.streamingHistory.music;
    if (!musicData || musicData.length === 0) {
        console.error("No music data available for visualization.");
        return;
    }
    const monthlyHours = {};
    musicData.forEach(record => {
        const date = new Date(record.endTime);
        const month = date.toLocaleString('default', { month: 'short' });
        const hours = record.msPlayed / (60000 * 60);

        if (monthlyHours[month]) {
            monthlyHours[month] += hours;
        } else {
            monthlyHours[month] = hours;
        }
    });

    const months = Object.keys(monthlyHours);
    const hours = Object.values(monthlyHours);

    const width = 600;
    const height = 400;
    const margin = { top: 30, right: 30, bottom: 60, left: 70 };

    d3.select("#listeningTimelineChart").selectAll("*").remove();

    const svg = d3.select("#listeningTimelineChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const xScale = d3.scalePoint()
        .domain(months)
        .range([margin.left, width - margin.right])
        .padding(0.5);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(hours)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale));

    const line = d3.line()
        .x((d, i) => xScale(months[i]))
        .y(d => yScale(d));

    svg.append("path")
        .data([hours])
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("d", line);

    const tooltip = d3.select("#tooltip");

    svg.selectAll("circle")
        .data(hours)
        .enter()
        .append("circle")
        .attr("cx", (d, i) => xScale(months[i]))
        .attr("cy", d => yScale(d))
        .attr("r", 5)
        .attr("fill", "#800000")
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1)
                .html(`Month: ${months[hours.indexOf(d)]}<br>${d.toFixed(2)} Hours`);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        })
        .on("click", (event, d) => {
            const selectedMonth = months[hours.indexOf(d)];
            updateTimeDistribution(selectedMonth);
            svg.selectAll("circle")
                .attr("fill", "lightgray");
            d3.select(event.currentTarget)
                .attr("fill", "#800000");
        });

        // Add X-axis title
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", (width - margin.left - margin.right) / 2 + margin.left)
            .attr("y", height - 10) // Slightly below the axis
            .text("Months")
            .style("font-size", "14px")
            .style("fill", "#800000");

        // Add Y-axis title
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", -(height - margin.top - margin.bottom) / 2 - margin.top)
            .attr("y", 15) // Slightly to the left of the axis
            .attr("transform", "rotate(-90)")
            .text("Hours Listened")
            .style("font-size", "14px")
            .style("fill", "#800000");
}

// **************************
// ********* Slot 5 *********
// **************************

// Top 8 artist treemap

// Get the top 8 listened artist for each user 
async function getTopArtists(userData, selectedMonth = null) {
    if (!userData || !userData.YourLibrary?.tracks) {
        console.warn("No library data found.");
        return [];
    }

    // Filter tracks by month if a month is selected
    const filteredTracks = selectedMonth
        ? userData.YourLibrary.tracks.filter(track => {
            const month = new Date(track.endTime).toLocaleString('default', { month: 'short' });
            return month === selectedMonth;
        })
        : userData.YourLibrary.tracks;

    const trackCounts = filteredTracks.reduce((acc, track) => {
        acc[track.artist] = (acc[track.artist] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(trackCounts)
        .map(([artist, count]) => ({ name: artist, value: count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
}


// Draw the top 8 artist treemap 
function drawTreemap(artistData) {
    const width = 500;
    const height = 300;
    d3.select("#treemap-container").selectAll("*").remove();

    // Create a color scale based on artist names
    const colorScale = d3.scaleOrdinal()
        .domain(artistData.map(d => d.name)) // Map each artist name
        .range(d3.schemeCategory10); // Use a predefined color scheme

    const treemap = d3.treemap()
        .size([width, height])
        .padding(1);

    const root = d3.hierarchy({ children: artistData })
        .sum(d => d.value);

    treemap(root);

    const svg = d3.select("#treemap-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const cell = svg.selectAll("g")
        .data(root.leaves())
        .enter().append("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    // Add rectangles and fill them with the color associated with each artist
    cell.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => colorScale(d.data.name)); // Use the color scale

    // Add artist names as text labels
    cell.append("text")
        .attr("x", 5)
        .attr("y", 15)
        .attr("dy", ".35em")
        .style("font-size", "12px")
        .style("fill", "white") // Ensure text is visible on dark colors
        .text(d => d.data.name)
        .each(function (d) {
            // Trim long names to fit within the rectangle
            const textLength = this.getComputedTextLength();
            const rectWidth = d.x1 - d.x0;
            if (textLength > rectWidth) {
                d3.select(this).text(d.data.name.substring(0, rectWidth / 8) + "...");
            }
        });

    const tooltip = d3.select("#tooltip");

    cell.selectAll("rect")
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1) // Make tooltip visible
                .html(`Artist: ${d.data.name}<br>Value: ${d.data.value}`); // Display artist name and value
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px"); // Position tooltip near the cursor
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0); // Hide tooltip
        })
        .on("mouseout", function(event, d) {
            // Hide the tooltip when mouse leaves the rectangle
            tooltip.style("opacity", 0); // Hide tooltip
        });
}

// Plot the treemap
async function plotTopArtistsTreemap(userData, selectedMonth = null) {
    const topArtists = await getTopArtists(userData, selectedMonth);
    if (topArtists.length > 0) {
        drawTreemap(topArtists);
    } else {
        console.warn("No artists found for this user.");
    }
}


// **************************
// ********* Slot 6 *********
// **************************

// Plot the genre distribution

// Function to aggregate and count genres
function aggregateGenres(genreData) {
    const genreCount = {};

    // Iterate through each artist's genres
    for (const artist in genreData) {

        const genres = genreData[artist];
        
        genres.forEach((genre) => {
            // Count occurrences of each genre
            if (genreCount[genre]) {
                genreCount[genre]++;
            } else {
                genreCount[genre] = 1;
            }
        });
    }

    // Convert the genreCount object to an array of [genre, count] pairs
    const genreArray = Object.keys(genreCount).map((genre) => ({
        genre: genre,
        count: genreCount[genre],
    }));

    // Sort genres by count in descending order
    genreArray.sort((a, b) => b.count - a.count);
    console.log(genreArray.length)

    // Keep only the top 10 genres
    return genreArray.slice(0, 10);
}

function plotGenrePieChart(genreData) {
    // Step 1: Aggregate genres
    const topGenres = aggregateGenres(genreData);

    // Step 2: Set up the pie chart
    const width = 300, height = 300, radius = Math.min(width, height) / 2;
    d3.select("#pieChart").selectAll("*").remove();

    // Use a color scale based on the genre names
    const color = d3.scaleOrdinal()
        .domain(topGenres.map(d => d.genre))  // Map genre names to the domain
        .range(d3.schemeSet3);  // You can replace d3.schemeSet3 with any other color palette or define your own

    // Create SVG element and append a group for the pie chart
    const svg = d3.select("#pieChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`); // Center the pie chart inside the SVG

    // Create pie function for calculating the angle of each slice
    const pie = d3.pie().value((d) => d.count);
    const arc = d3.arc().outerRadius(radius).innerRadius(0);  // Pie slices

    // Step 3: Bind data to pie chart and create the slices
    const arcs = svg.selectAll(".arc")
        .data(pie(topGenres))
        .enter()
        .append("g")
        .attr("class", "arc");

    // Append pie slices
    arcs.append("path")
        .attr("d", arc)
        .style("fill", (d) => color(d.data.genre));

    // Add percentage labels inside each slice
    arcs.append("text")
        .attr("transform", (d) => `translate(${arc.centroid(d)})`)
        .attr("class", "percentage")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text((d) => `${Math.round((d.data.count / d3.sum(topGenres, (d) => d.count)) * 100)}%`);

    // Step 4: Create the legend on the right side of the chart
    const legendWidth = 12;   // Smaller size for the dots
    const legendHeight = 12;  // Smaller size for the dots
    const legendSpacing = 18; // Adjust the vertical spacing between legend items to ensure all 20 fit
    const legend = svg.append("g")
        .attr("transform", `translate(${radius + 10}, ${-radius / 2})`); // Position the legend to the right of the pie chart

    // Add legend items (color and genre name)
    legend.selectAll(".legend")
        .data(topGenres)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0, ${i * legendSpacing})`) // Increase vertical spacing

        // Add colored circles to legend
        .append("circle")
        .attr("cx", 0)
        .attr("cy", legendHeight / 2)  // Position circle vertically centered
        .attr("r", 6)  // Small dot size
        .style("fill", (d) => color(d.genre));

    // Add genre text to the legend
    legend.selectAll(".legendText")
        .data(topGenres)
        .enter()
        .append("text")
        .attr("x", legendWidth + 5)
        .attr("y", (d, i) => i * legendSpacing + legendHeight / 2)
        .attr("dy", ".35em")
        .text((d) => d.genre)
        .style("font-size", "12px");

    const tooltip = d3.select("#tooltip");

    arcs.selectAll("path")
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1) // Make tooltip visible
                   .html(`Genre: ${d.data.genre}<br>Count: ${d.data.count}`); // Display genre and count
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 20) + "px"); // Position tooltip near the cursor
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0); // Hide tooltip
        });
}


// **************************
// ********* Slot 7 *********
// **************************

// Comparaison between podcast and music listening habits

// Helper function to convert timestamp to year-month format
function formatToYearMonth(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // Month is zero-indexed
    return `${year}-${String(month).padStart(2, '0')}`;
}

// Function to aggregate streaming time per month
function aggregateStreamingData(streamingData) {
    const monthlyData = {};

    streamingData.forEach(entry => {
        if (entry.msPlayed > 0) { // Only consider entries with valid playtime
            const yearMonth = formatToYearMonth(entry.endTime);
            monthlyData[yearMonth] = (monthlyData[yearMonth] || 0) + entry.msPlayed;
        }
    });

    // Convert to array for easier charting
    return Object.entries(monthlyData).map(([month, msPlayed]) => ({
        month,
        hoursPlayed: msPlayed / (1000 * 60 * 60), // Convert ms to hours
    }));
}

// Function to prepare data for visualization
function prepareComparisonData(userData) {
    const musicData = aggregateStreamingData(userData.streamingHistory.music);
    const podcastData = aggregateStreamingData(userData.streamingHistory.podcast);

    console.log("Music Monthly Data:", musicData);
    console.log("Podcast Monthly Data:", podcastData);

    // Create a unified dataset for visualization
    const allMonths = new Set([...musicData.map(d => d.month), ...podcastData.map(d => d.month)]);
    const comparisonData = [];

    allMonths.forEach(month => {
        const music = musicData.find(d => d.month === month);
        const podcast = podcastData.find(d => d.month === month);

        console.log("Music mapping:", music);
        console.log("Podcast mapping:", podcast);

        comparisonData.push({
            month,
            musicHours: music ? music.hoursPlayed : 0,
            podcastHours: podcast ? podcast.hoursPlayed : 0,
        });
    });


    // Sort by month
    return comparisonData.sort((a, b) => new Date(a.month) - new Date(b.month));
}


function plotPodcastMusicChart(allUsersData) {
    const comparisonData = prepareComparisonData(allUsersData);

    console.log("Comparison data: ", comparisonData);

    const margin = { top: 20, right: 20, bottom: 50, left: 50 };
    const width = 400;
    const height = 200;

    // Remove any existing chart
    d3.select("#podcastMusicChart").selectAll("*").remove();

    // Create the SVG container
    const svg = d3.select("#podcastMusicChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    

    // Set up scales
    const xScale = d3.scaleBand()
        .domain(comparisonData.map(d => d.month))
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(comparisonData, d => Math.max(d.musicHours, d.podcastHours))])
        .range([height, 0]);

    // Draw axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(10));

    // Draw music bars
    svg.selectAll(".bar.music")
        .data(comparisonData)
        .enter()
        .append("rect")
        .attr("class", "bar music")
        .attr("x", d => xScale(d.month))
        .attr("y", d => yScale(d.musicHours))
        .attr("width", xScale.bandwidth() / 2)
        .attr("height", d => height - yScale(d.musicHours))
        .attr("fill", "#1DB954"); // Spotify green for music

    // Draw podcast bars
    svg.selectAll(".bar.podcast")
        .data(comparisonData)
        .enter()
        .append("rect")
        .attr("class", "bar podcast")
        .attr("x", d => xScale(d.month) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.podcastHours))
        .attr("width", xScale.bandwidth() / 2)
        .attr("height", d => height - yScale(d.podcastHours))
        .attr("fill", "#FFC107"); // Yellow for podcasts

    // Add legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 100}, ${-10})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "#1DB954");

    legend.append("text")
        .attr("x", 30)
        .attr("y", 15)
        .text("Music")
        .style("font-size", "14px")
        .attr("alignment-baseline", "middle");

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 30)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "#FFC107");

    legend.append("text")
        .attr("x", 30)
        .attr("y", 45)
        .text("Podcasts")
        .style("font-size", "14px")
        .attr("alignment-baseline", "middle");
}

// **************************
// ********* Slot 8 *********
// **************************

async function artistDensityChart(userData){

    console.log("************je suis dans artistDensityChart");
    const musicData = userData.streamingHistory.music;
    const nodes = [];
    const nodeMap ={};
    const links = [];

    musicData.forEach(d => {
        if(!nodeMap[d.artistName]){
            nodes.push({ id: d.artistName, group: 'artistName'});
            nodeMap[d.artistName]= true;
        }
        if(!nodeMap[d.trackName]){
            nodes.push({ id: d.trackName, group: 'trackName'});
            nodeMap[d.trackName] = true;
        }
        links.push({ source: d.artistName, target: d.trackName, value: 1 });
    });

    const width = 1000;
    const height = 600;
    const color = d3.scaleOrdinal()
    .domain(['artistName', 'trackName'])  // Définir les types de groupes
    .range(['#800000', '#E8D2A6']);  // Noir pour les artistes, rouge pour les pistes

    // Créer un tableau de liens entre les artistes et les musiques
    const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id))
    .force("charge", d3.forceManyBody())
    .force("x", d3.forceX())
    .force("y", d3.forceY());

    d3.select("#fdGraph").selectAll("*").remove();

    const svg = d3.select("#fdGraph")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width: 100%; height: auto;");

const link = svg.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke-width", d => Math.sqrt(d.value));

const node = svg.append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 5)
    .attr("fill", d => color(d.group))
    .on("mouseover", (event, d) => {
        const numLinks = links.filter(link => link.source.id === d.id || link.target.id === d.id).length;
        tooltip.style("opacity", 1)
               .html(`
                    ${d.group === 'artistName' ? 'Artist' : 'Track'} : ${d.id}<br>
                    <strong>Links:</strong> ${numLinks}
                `);
    })
    .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", () => {
        tooltip.style("opacity", 0);
    });

// node.append("title")
//     .text(d => d.id);

node.call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

const tooltip = d3.select("#tooltip");


simulation.on("tick", () => {
  link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

  node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

});


function dragstarted(event) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  event.subject.fx = event.subject.x;
  event.subject.fy = event.subject.y;
}

function dragged(event) {
  event.subject.fx = event.x;
  event.subject.fy = event.y;
}

function dragended(event) {
  if (!event.active) simulation.alphaTarget(0);
  event.subject.fx = null;
  event.subject.fy = null;
}

// invalidation.then(() => simulation.stop());

return svg.node();
}