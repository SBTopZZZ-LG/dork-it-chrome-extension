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
window.onload = function () {
	// Event handlers
	document.getElementById("filter-select").addEventListener("change", onFilterSelect);
	document.getElementById("add-filter").addEventListener("click", onAddFilter);
	document.getElementById("go-button").addEventListener("click", onGoButton);
};

// ----- Input Fields -----
//// Keyword Input
function keywordInput(value) {
	return `<input id="filter-input" class="input is-rounded" type="text" value="${encodeURIComponent(filters[value][1] ?? "")}" placeholder="Keyword" />`;
}

//// String Input
function stringInput(value) {
	return `<input id="filter-input" class="input is-rounded" type="text" value="${encodeURIComponent(filters[value][1] ?? "")}" placeholder="String" />`;
}

//// Site Input
function siteInput(value) {
	return `<input id="filter-input" class="input is-rounded" type="url" value="${encodeURIComponent(filters[value][1] ?? "")}" placeholder="Site" />`;
}

//// Numerical Range Input
function numericalRangeInput(value) {
	return `<div style="display: inline-flex; flex-direction: row"><input id="filter-input-1" class="input is-rounded" type="number" value="${encodeURIComponent(filters[value][1]?.split(/\-/)[0] ?? "")}" placeholder="Start" /><div style="width: 40px"></div><input id="filter-input-2" class="input is-rounded" type="number" value="${encodeURIComponent(filters[value][1]?.split(/\-/)[1] ?? "")}" placeholder="Stop" /></div>`;
}

//// File Type Input
function fileTypeInput(value) {
	return `<datalist id="file-type-options"><option value="pdf"></option><option value="doc"></option><option value="docx"></option><option value="xls"></option><option value="xlsx"></option><option value="ppt"></option><option value="pptx"></option><option value="txt"></option><option value="csv"></option><option value="xml"></option><option value="json"></option><option value="mp3"></option><option value="mp4"></option><option value="jpg"></option><option value="jpeg"></option><option value="png"></option><option value="gif"></option><option value="zip"></option><option value="rar"></option></datalist><input id="filter-input" class="input is-rounded" type="text" value="${encodeURIComponent(filters[value][1] ?? "")}" list="file-type-options" placeholder="File Type" />`;
}
// ----- Input Fields -----

// ----- Event Handlers -----
//// On Select
function onFilterSelect() {
	const value = parseInt(document.getElementById("filter-select").value, 10);
	const view = document.getElementById("filter-view");

	let currentElement = null;
	if ([1, 3, 5, 7, 12].includes(value))
		currentElement = stringInput(value - 1);
	else if ([2, 4, 6, 11].includes(value))
		currentElement = keywordInput(value - 1);
	else if ([8, 13, 14].includes(value))
		currentElement = siteInput(value - 1);
	else if (value === 9)
		currentElement = numericalRangeInput(value - 1);
	else if (value === 10)
		currentElement = fileTypeInput(value - 1);

	if (value === 0)
		view.removeChild(view.firstChild);

	if (currentElement === null)
		return;

	view.innerHTML = currentElement;
}

//// On add filter
function onAddFilter() {
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
	document.getElementById("filters").insertAdjacentHTML("beforeend", `<div class="filter fade-in"><span>${filters[value][0]}:${value === 8 ? `${filters[value][1]}` : `"${filters[value][1]}"`}</span></div>`);
	const div = document.getElementById("filters").lastChild;
	div.insertAdjacentHTML("beforeend", '<img style="margin-left: 10px; cursor: pointer" alt="Cancel" src="img/cancel.svg" width="16px" height="16px" />');
	const img = div.lastChild;

	filters[value][2] = div;

	img.addEventListener("click", () => {
		// Fade out
		div.classList.remove("fade-in");
		div.classList.add("fade-out");

		setTimeout(() => {
			// After animation ends, delete filter
			document.getElementById("filters").removeChild(div);
			filters[value][1] = filters[value][2] = null;

			// Update count
			document.getElementById("filter-count").innerText = filters.filter(filter => !!filter[2]).length;
		}, 250);
	});
}

//// On go button
function onGoButton() {
	let query = "";
	for (let i = 0; i < filters.length; i++) {
		if (filters[i][1] === null) continue;

		if (i === 0)
			query += `"${filters[i][1]}" `;
		else if (i === 8)
			query += `${filters[i][0]}:${filters[i][1]} `;
		else
			query += `${filters[i][0]}:"${filters[i][1]}" `;
	}

	window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
}
// ----- Event Handlers -----
