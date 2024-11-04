// pvanaki.js - Homework #3: D3 Linking - CSE 478 - Fall 2024
const vowels = "aeiouy";
const consonants = "bcdfghjklmnpqrstvwxyz";
const punctuation = ".,!?;:";

function processText() {
    const text = document.getElementById("wordbox").innerText.toLowerCase();
    const data = {
        name: "root",
        children: [
            { name: "Vowels", children: [] },
            { name: "Consonants", children: [] },
            { name: "Punctuation", children: [] }
        ]
    };

    const counts = {};
    for (let char of text) {
        if (vowels.includes(char) || consonants.includes(char) || punctuation.includes(char)) {
            counts[char] = (counts[char] || 0) + 1;
        }
    }

    for (let [char, count] of Object.entries(counts)) {
        if (vowels.includes(char)) {
            data.children[0].children.push({ name: char, value: count });
        } else if (consonants.includes(char)) {
            data.children[1].children.push({ name: char, value: count });
        } else if (punctuation.includes(char)) {
            data.children[2].children.push({ name: char, value: count });
        }
    }

    drawTreemap(data, text);
}

function createTooltip() {
    return d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #000")
        .style("padding", "5px")
        .style("border-radius", "3px")
        .style("pointer-events", "none")
        .style("opacity", 1); // Tooltip stays visible
}

function showTooltip(tooltip, htmlContent, event) {
    tooltip.html(htmlContent)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`)
        .style("opacity", 1); // Ensure it remains visible
}

function moveTooltip(tooltip, event) {
    tooltip.style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
}

function hideTooltip(tooltip) {
    tooltip.style("opacity", 0) // Tooltip remains but hidden
        .style("left", "-9999px"); // Move out of view
}

function drawTreemap(data, text) {
    const tooltip = createTooltip(); // Create tooltip once for the treemap

    const width = 580;
    const height = 400;
    const color = d3.scaleOrdinal().domain(["Vowels", "Consonants", "Punctuation"])
        .range(["#6b486b", "#ff8c00", "#d0743c"]);

    const svg = d3.select("#treemap_svg").attr("width", width).attr("height", height);
    svg.selectAll("*").remove(); 

    const root = d3.hierarchy(data).sum(d => d.value);
    d3.treemap().size([width, height]).padding(1)(root);

    const nodes = svg.selectAll("rect")
        .data(root.leaves())
        .enter()
        .append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .style("fill", d => color(d.parent.data.name))
        .style("stroke", "black")
        .style("stroke-width", 1)
        .on("click", function (event, d) {
            if (d && d.data && d.data.name) {
                drawSankey(d.data.name, text);  
            }
        })
        .on("mouseover", function(event, d) {
            showTooltip(tooltip, `Character: ${d.data.name}<br>Count: ${d.data.value}`, event);
            highlightTextarea(d.data.name); 
            highlightCorrespondingNodes(d.data.name); 
        })
        .on("mousemove", function(event) {
            moveTooltip(tooltip, event);
        })
        .on("mouseout", function() {
            hideTooltip(tooltip);
            removeHighlightTextarea(); 
            removeHighlightNodes(); 
        });
}

function drawSankey(char, text) {
    document.getElementById("flow_label").innerText = `Character flow for '${char}'`;

    const sankeyData = generateSankeyData(char, text);
    if (!sankeyData || !sankeyData.nodes.length) {
        console.log("Error: Sankey data is empty or invalid.");
        return;
    }

    const width = 500;
    const height = 350;
    const tooltip = createTooltip(); 

    const sankeySvg = d3.select("#sankey_svg").attr("width", width).attr("height", height);
    sankeySvg.selectAll("*").remove();

    const sankey = d3.sankey()
        .nodeWidth(10)
        .nodePadding(12)
        .extent([[50, 1], [width - 50, height - 1]]); 

    const {nodes, links} = sankey({
        nodes: sankeyData.nodes.map(d => Object.assign({}, d)),
        links: sankeyData.links.map(d => Object.assign({}, d))
    });

    const color = d3.scaleOrdinal().domain(["Vowels", "Consonants", "Punctuation"])
        .range(["#6b486b", "#ff8c00", "#d0743c"]);

    sankeySvg.append("g")
        .selectAll("rect")
        .data(nodes)
        .enter()
        .append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("fill", d => {
            if (vowels.includes(d.name)) return "#6b486b";
            if (consonants.includes(d.name)) return "#ff8c00";
            return "#d0743c"; 
        })
        .attr("stroke", "black")
        .on("mouseover", function(event, d) {
            const content = d.index === 0
                ? `Character '${d.name}' appears ${d.value} times.`
                : (d.x0 < sankey.extent()[1][0] / 2
                    ? `Character '${d.name}' flows into '${char}' ${d.value} times.`
                    : `Character '${char}' flows into '${d.name}' ${d.value} times.`);

            showTooltip(tooltip, content, event);
            highlightTextarea(d.name); 
            highlightCorrespondingNodes(d.name); 
        })
        .on("mousemove", function(event) {
            moveTooltip(tooltip, event);
        })
        .on("mouseout", function() {
            hideTooltip(tooltip);
            removeHighlightTextarea(); 
            removeHighlightNodes(); 
        });

    
    sankeySvg.append("g")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("x", d => d.x0 < width / 2 ? d.x0 - 6 : d.x1 + 6)
        .attr("y", d => (d.y0 + d.y1) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "end" : "start")
        .text(d => d.name)
        .style("fill", "#000");


    sankeySvg.append("g")
        .selectAll("path")
        .data(links)
        .enter()
        .append("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", "#d0743c")
        .attr("stroke-width", d => Math.max(1, d) )
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("fill", "none")
        .attr("opacity", 0.5)  
        .on("mouseover", function(event, d) {
            const content = `Character '${d.source.name}' flows into '${d.target.name}' ${d.value} times.`;
            showTooltip(tooltip, content, event);
            highlightCorrespondingNodes(d.source.name); 
            highlightTextarea(d.source.name); 
        })
        .on("mousemove", function(event) {
            moveTooltip(tooltip, event);
        })
        .on("mouseout", function() {
            hideTooltip(tooltip);
            removeHighlightNodes(); 
            removeHighlightTextarea(); 
        });
}


function generateSankeyData(char, text) {
    const validCharacters = "abcdefghijklmnopqrstuvwxyz.,!?"; 
    const nodes = [{ name: char }];
    const links = [];

    const beforeChars = {};
    const afterChars = {};

   
    for (let i = 0; i < text.length; i++) {
        if (text[i] === char) {
            if (i > 0) {
                const prevChar = text[i - 1];
                if (validCharacters.includes(prevChar)) { 
                    beforeChars[prevChar] = (beforeChars[prevChar] || 0) + 1;
                }
            }
            if (i < text.length - 1) {
                const nextChar = text[i + 1];
                if (validCharacters.includes(nextChar)) { 
                    afterChars[nextChar] = (afterChars[nextChar] || 0) + 1;
                }
            }
        }
    }

    let index = 1; 
    const beforeNodeMap = {};
    Object.keys(beforeChars).forEach(prev => {
        beforeNodeMap[prev] = index;
        nodes.push({ name: prev });
        links.push({ source: index, target: 0, value: beforeChars[prev] });
        index++;
    });
    Object.keys(afterChars).forEach(next => {
        nodes.push({ name: next });
        links.push({ source: 0, target: index, value: afterChars[next] });
        index++;
    });

    return { nodes, links };
}

function highlightTextarea(char) {
    const wordbox = document.getElementById("wordbox");
    const text = wordbox.innerText;
    
   
    let highlightedText = "";
    for (let i = 0; i < text.length; i++) {
        const currentChar = text[i];
        if (currentChar.toLowerCase() === char.toLowerCase()) {
            highlightedText += `<span class="highlight">${currentChar}</span>`;
        } else {
            highlightedText += currentChar;
        }
    }

    
    wordbox.innerHTML = highlightedText;
}

function removeHighlightTextarea() {
    const wordbox = document.getElementById("wordbox");
    wordbox.innerText = wordbox.innerText; 
}


function highlightCorrespondingNodes(char) {
   
    d3.selectAll("#treemap_svg rect")
        .filter(function(d) { return d.data.name === char; })
        .style("stroke", "red")
        .style("stroke-width", 3);


    d3.selectAll("#sankey_svg rect")
        .filter(function(d) { return d.name === char; })
        .style("stroke", "red")
        .style("stroke-width", 3);
}

function removeHighlightNodes() {
 
    d3.selectAll("#treemap_svg rect")
        .style("stroke", "black")
        .style("stroke-width", 1);

    d3.selectAll("#sankey_svg rect")
        .style("stroke", "black")
        .style("stroke-width", 1);
}