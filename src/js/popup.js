// Vars
//// List of all filters (one of each kind), where [0] is the value, and [1] is the referenced element.
const filters_names = [
	"Search for",
	"intitle",
	"allintitle",
	"intext",
	"allintext",
	"inurl",
	"allinurl",
	"site",
	"numrange",
	"inext",
	"inanchor",
	"allinanchor",
	"related",
	"cache",
];
const filters = filters_names.map(name => [name, null, null]);

// Initialize
window.onload = async function () {
	// Event handlers
	document.getElementById("filter-select").addEventListener("change", onFilterSelect);
	document.getElementById("add-filter").addEventListener("click", onAddFilter);
	document.getElementById("go-button").addEventListener("click", onGoButton);
	document.getElementById("rate-us").addEventListener("click", onRateUsButton);

	// Trigger `go-button` press when Enter key is pressed in the context of `body`
	document.body.onkeydown = e => {
		if (e.key === "Enter")
			document.getElementById("go-button").click();
	};

	// Load saved filters
	const saved_filters = (await chrome.storage.local.get(["filters"]))?.filters;

	// Check if the saved filters is valid
	if (!Array.isArray(saved_filters) || saved_filters.length !== filters.length || saved_filters.find(saved_filter => saved_filter !== null && typeof value !== "string") >= 0)
		// Invalid save, delete save
		await chrome.storage.local.remove(["filters"]);
	else {
		// Valid save
		for (let i = 0; i < saved_filters.length; i++)
			filters[i][1] = saved_filters[i];

		// Create elements
		for (let i = 0; i < filters.length; i++) {
			if (filters[i][1] === null) continue;

			// Create element
			createFilterElement(i, saveToStorage);
		}

		// Enable go button?
		document.getElementById("go-button").disabled = filters.every(filter => filter[2] === null);
	}
};

// ----- Input Fields -----
//// Keyword Input
function keywordInput(value) {
	return `<input id="filter-input" class="input is-rounded" type="text" value="${filters[value][1] ?? ""}" placeholder="Keyword" />`;
}

//// String Input
function stringInput(value) {
	return `<input id="filter-input" class="input is-rounded" type="text" value="${filters[value][1] ?? ""}" placeholder="String" />`;
}

//// Site Input
function siteInput(value) {
	return `<input id="filter-input" class="input is-rounded" type="url" value="${filters[value][1] ?? ""}" placeholder="Site" />`;
}

//// Numerical Range Input
function numericalRangeInput(value) {
	return `<div style="display: inline-flex; flex-direction: row"><input id="filter-input-1" class="input is-rounded" type="number" value="${filters[value][1]?.split(/\-/)[0] ?? ""}" placeholder="Start" /><div style="width: 40px"></div><input id="filter-input-2" class="input is-rounded" type="number" value="${filters[value][1]?.split(/\-/)[1] ?? ""}" placeholder="Stop" /></div>`;
}

//// File Type Input
function fileTypeInput(value) {
	return `<datalist id="file-type-options"><option value="pdf"></option><option value="doc"></option><option value="docx"></option><option value="xls"></option><option value="xlsx"></option><option value="ppt"></option><option value="pptx"></option><option value="txt"></option><option value="csv"></option><option value="xml"></option><option value="json"></option><option value="mp3"></option><option value="mp4"></option><option value="jpg"></option><option value="jpeg"></option><option value="png"></option><option value="gif"></option><option value="zip"></option><option value="rar"></option></datalist><input id="filter-input" class="input is-rounded" type="text" value="${filters[value][1] ?? ""}" list="file-type-options" placeholder="File Type" />`;
}
// ----- Input Fields -----

// ----- Event Handlers -----
//// On Select
function onFilterSelect() {
	const value = parseInt(document.getElementById("filter-select").value, 10);
	const view = document.getElementById("filter-view");

	let currentElement = null, fieldIds = [];
	if ([1, 3, 5, 7, 12].includes(value)) {
		currentElement = stringInput(value - 1);
		fieldIds = ["filter-input"];
	}
	else if ([2, 4, 6, 11].includes(value)) {
		currentElement = keywordInput(value - 1);
		fieldIds = ["filter-input"];
	}
	else if ([8, 13, 14].includes(value)) {
		currentElement = siteInput(value - 1);
		fieldIds = ["filter-input"];
	}
	else if (value === 9) {
		currentElement = numericalRangeInput(value - 1);
		fieldIds = [
			"filter-input-1",
			"filter-input-2"
		];
	}
	else if (value === 10) {
		currentElement = fileTypeInput(value - 1);
		fieldIds = ["filter-input"];
	}

	if (value === 0) {
		view.removeChild(view.firstChild);

		// Disable add filter button
		document.getElementById("add-filter").disabled = true;

		return;
	}

	// Enable add filter button
	document.getElementById("add-filter").disabled = false;

	if (currentElement === null)
		return;

	view.innerHTML = currentElement;

	for (const id of fieldIds)
		document.getElementById(id).onkeydown = e => {
			// Prevent propogation
			e.stopPropagation();

			if (e.key === "Enter") {
				// Trigger button click and lose focus
				document.getElementById("add-filter").click();
				document.getElementById(id).blur();
			}
		};
}

//// On add filter
async function onAddFilter() {
	const value = parseInt(document.getElementById("filter-select").value, 10) - 1;

	if (value < 0)
		return;

	if (value === 8) {
		// Numerical Range

		const start = document.getElementById("filter-input-1").value;
		const stop = document.getElementById("filter-input-2").value;

		filters[value][1] = `${start}-${stop}`;
	} else {
		// Directly readable

		const input = document.getElementById("filter-input").value;

		filters[value][1] = input;
	}

	// Check if filter already exists
	if (filters[value][2] !== null) {
		// Delete old filter first
		document.getElementById("filters").removeChild(filters[value][2]);
		filters[value][2] = null;
	}

	// Create element
	createFilterElement(value, saveToStorage);

	await saveToStorage();
}

//// On go button
function onGoButton() {
	let query = "";
	for (let i = 0; i < filters.length; i++) {
		if (filters[i][1] === null) continue;

		if (i === 0)
			query += `"${filters[i][1]}" `;
		else if (i === 7)
			query += `${filters[i][0]}:${filters[i][1]} `;
		else if (i === 8)
			query += `${filters[i][0]}:${filters[i][1]} `;
		else
			query += `${filters[i][0]}:"${filters[i][1]}" `;
	}

	// If no filters exist, do nothing
	if (query === "")
		return;

	window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
}

//// On rate us button
function onRateUsButton() {
	window.open("https://chrome.google.com/webstore/detail/dork-it/lnihadedihilhjcbnimcobnppdlldocm", "_blank");
}
// ----- Event Handlers -----

// ----- Methods -----
//// Create Filter element
function createFilterElement(index, onRemoved) {
	document.getElementById("filters").insertAdjacentHTML("beforeend", `<div class="filter fade-in"><span>${filters[index][0]}:${index === 8 ? `${filters[index][1]}` : `"${filters[index][1]}"`}</span></div>`);
	const div = document.getElementById("filters").lastChild;
	div.insertAdjacentHTML("beforeend", '<img style="margin-left: 10px; cursor: pointer" alt="Cancel" src="img/cancel.svg" width="16px" height="16px" />');
	const img = div.lastChild;

	filters[index][2] = div;

	img.addEventListener("click", (e) => {
		// Prevent further propogation for unexpected changes
		e.stopPropagation();

		// Fade out
		div.classList.remove("fade-in");
		div.classList.add("fade-out");

		setTimeout(() => {
			// After animation ends, delete filter
			document.getElementById("filters").removeChild(div);
			filters[index][1] = filters[index][2] = null;

			// Update count
			document.getElementById("filter-count").innerText = filters.filter(filter => !!filter[2]).length;

			// If there are no more active filters, disable go button
			document.getElementById("go-button").disabled = filters.every(filter => filter[2] === null);

			// Cleanup callback?
			if (onRemoved)
				try {
					onRemoved(index);
				} catch (_) { }
		}, 250);
	});

	// Update count
	document.getElementById("filter-count").innerText = filters.filter(filter => !!filter[2]).length;

	// Enable go button
	document.getElementById("go-button").disabled = false;
}

//// Save filters to storage
async function saveToStorage() {
	try {
		// Write filters to storage
		await chrome.storage.local.set({
			filters: filters.map(filter => filter[1]),
		});
	} catch (error) {
		// Cannot write to storage
		console.error(error);
	}
}
// ----- Methods -----
