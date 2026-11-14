let imgs = document.querySelectorAll(".showcase img");
let modal = document.createElement("div");
let img0 = document.createElement("img");
modal.id = "modal";
img0.id = "img0";
document.body.appendChild(modal);
modal.appendChild(img0);

for (var i = 0; i < imgs.length; i++) {
	let img = imgs[i];
	img.tabIndex = "0";
	img.id = i;
	img.onclick = function () {
		img0.src = img.src;
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
	img.addEventListener("keydown", e => {
		if (e.key == "Enter") {
			img.click();
		}
	});
}

window.addEventListener('hashchange', e => {
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

modal.onclick = e => {
	if (!e.target.closest("#img0bg")) {
		hide();
	}
};

window.addEventListener("keydown", e => {
	if (e.key == "Escape") {
		hide();
	}
});

modal.addEventListener("animationend", e => {
	if (e.animationName == "hide") {
		modal.style.display = "none";
	}
});

function hide() {
	modal.style.animation = "hide .2s forwards";
	history.replaceState({}, {}, location.href.split("#")[0]);
}
