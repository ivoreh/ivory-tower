let modal = document.getElementById("modal");
let img0 = document.getElementById("img0");
let caption = document.getElementById("caption");
let imgs = document.querySelectorAll(".showcase img");

for (var i = 0; i < imgs.length; i++) {
	let img = imgs[i];
	img.tabIndex = "0";
	img.id = i;
	img.onclick = function () {
		img0.src = img.src;
		caption.innerHTML = img.parentNode.lastElementChild.textContent;
		img0.height = img.naturalHeight;
		img0.width = img.naturalWidth;
		modal.style.animation = "";
		modal.style.display = "flex";
		location.replace("#" + img.id);
		img.closest(".showcase").classList.contains("pixelart") || img.classList.contains("pixelart") ? img0.className = "pixelart" : img0.className = "";
	};
	if ("#" + img.id == window.location.hash) {
		img.click();
	}
	img.addEventListener("keydown", k => {
		if (k.key == "Enter") {
			img.click();
		}
	});
}

window.addEventListener('hashchange', evt => {
	let hash = window.location.hash;
	if (hash) {
		let query = document.querySelector(hash);
		if (query.tagName == "IMG") {
			query.click();
		}
	} else {
		modal.style.display = "none";
	}
});

modal.onclick = evt => {
	if (!evt.target.closest("#img0bg")) {
		hide();
	}
};

window.addEventListener("keydown", evt => {
	if (evt.key == "Escape") {
		hide();
	}
});

modal.addEventListener("animationend", evt => {
	if (evt.animationName == "hide") {
		modal.style.display = "none";
	}
});

function hide() {
	modal.style.animation = "hide .2s forwards";
	history.replaceState({}, {}, location.href.split("#")[0]);
}
