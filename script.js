let db;
let editIndex = null;
let users = JSON.parse(localStorage.getItem("users")) || [];
const userData = JSON.parse(sessionStorage.getItem("loggedInUser"));
const userName = userData && userData.username;
const userPass = userData && userData.password;

// --- Inisialisasi IndexedDB ---
const request = indexedDB.open("KalkulatorHargaDB", 1);

request.onupgradeneeded = function (event) {
  db = event.target.result;
  if (!db.objectStoreNames.contains("produk")) {
    db.createObjectStore("produk", {
      keyPath: "id",
      autoIncrement: true,
    });
  }
};

request.onsuccess = function (event) {
  db = event.target.result;
  tampilkanData();
};

request.onerror = function () {
  alert("Gagal membuka database IndexedDB!");
};
  
// --- Fungsi CRUD IndexedDB ---
function tambahData(event) {
  event.preventDefault();
  const produk = document.getElementById("produk").value.trim();
  const modal = toNumber(document.getElementById("modal").value);
  const berat = toNumber(document.getElementById("berat").value || 0);
  const kemasan = toNumber(document.getElementById("kemasan").value || 0);
  const laba = toNumber(document.getElementById("laba").value);
  const diskon = toNumber(document.getElementById("diskon").value || 0);
  const proses = toNumber(document.getElementById("proses").value || 0);
  const ongkir = toNumber(document.getElementById("ongkir").value || 0);
  const fee = toNumber(document.getElementById("fee").value);
	const infoText = "Wajib untuk diisi!";
	const infoProduk = document.querySelector(".info-produk");
	const infoModal = document.querySelector(".info-modal");
	const infoBerat = document.querySelector(".info-berat");
	const infoLaba = document.querySelector(".info-laba");
	const infoProses = document.querySelector(".info-proses");
	const infoFee = document.querySelector(".info-fee");
	infoProduk.textContent = "";
	infoModal.textContent = "";
	infoBerat.textContent = "";
	infoLaba.textContent = "";
	infoProses.textContent = "";
	infoFee.textContent = "";
	if (!produk) {
		document.getElementById("produk").focus();
		infoProduk.textContent = infoText;
		return;
	}
	if (isNaN(modal) || modal === 0) {
		document.getElementById("modal").focus();
		infoModal.textContent = infoText;
		return;
	}
	if (isNaN(berat) || berat === 0) {
		document.getElementById("berat").focus();
		infoBerat.textContent = infoText;
		return;
	}
	if (isNaN(laba) || laba === 0) {
		document.getElementById("laba").focus();
		infoLaba.textContent = infoText;
		return;
	}
	if (isNaN(proses) || proses === 0) {
		document.getElementById("proses").focus();
		infoProses.textContent = infoText;
		return;
	}
		if (isNaN(fee) || fee === 0) {
		document.getElementById("fee").focus();
		infoFee.textContent = infoText;
		return;
	}

  const tanggalSekarang = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const hasil = hitungHarga(
    modal,
    berat,
    kemasan,
    laba,
    diskon,
    proses,
    ongkir,
    fee
  );
  const item = {
    produk,
    modal,
    berat,
    kemasan,
    laba,
    diskon,
    proses,
    ongkir,
    fee,
    tanggalSekarang,
    userName,
    ...hasil,
  };

  const tx = db.transaction("produk", "readwrite");
  const store = tx.objectStore("produk");

  if (editIndex !== null) {
    item.id = editIndex;
    store.put(item);
    editIndex = null;
    document.getElementById("btnSimpan").textContent = "Simpan";
  } else {
    store.add(item);
  }

  tx.oncomplete = () => {
		closeModal();
    tampilkanData();
    document.querySelectorAll("input").forEach((i) => (i.value = ""));
		const baris = document.querySelector(`#tabelData tr[data-id='${item.id}']`);
		if (!baris) return;
		const kolom = baris.querySelectorAll("td");
		kolom[1].textContent = item.produk;
		kolom[2].textContent = item.berat.toString();
		kolom[3].textContent = fmt(item.modal);
		kolom[4].textContent = fmt(item.kemasan);
		kolom[5].textContent = fmt(item.proses);
		kolom[6].textContent = fmt(item.ongkir);
		kolom[7].textContent = item.laba.toString();
		kolom[8].textContent = item.diskon.toString();
		kolom[9].textContent = item.fee.toString();
		kolom[10].textContent = fmt(item.modalTotal);
		kolom[11].textContent = fmt(item.hargaJual);
		kolom[12].textContent = fmt(item.hargaAkhir);
		kolom[13].textContent = fmt(item.saldoMasuk);
		kolom[14].textContent = fmt(item.labaBersih);
		kolom[15].textContent = item.tanggalSekarang;
  };
}

function tampilkanData() {
  const tbody = document.querySelector("#tabelData tbody");
  tbody.innerHTML = "";
  const tx = db.transaction("produk", "readonly");
  const store = tx.objectStore("produk");
  store.getAll().onsuccess = function (event) {
    const data = event.target.result.sort((a, b) => b.id - a.id);
		dataResult(data);
  };
}

function editData(id) {
  const tx = db.transaction("produk", "readonly");
  const store = tx.objectStore("produk");

  store.get(id).onsuccess = function (event) {
    const d = event.target.result;
    editIndex = d.id;
    document.getElementById("produk").value = d.produk;
    document.getElementById("modal").value = d.modal;
    document.getElementById("berat").value = d.berat;
    document.getElementById("kemasan").value =
      d.kemasan === 0 ? "" : d.kemasan;
    document.getElementById("laba").value = d.laba;
    document.getElementById("diskon").value =
      d.diskon === 0 ? "" : d.diskon;
    document.getElementById("proses").value = d.proses;
    document.getElementById("ongkir").value =
      d.ongkir === 0 ? "" : d.ongkir;
    document.getElementById("fee").value = d.fee;
    openModal();
    document.querySelector(".form-box h3").textContent =
      "Perbarui Data Produk";
    document.getElementById("btnSimpan").textContent = "Simpan Perubahan";
    document.querySelectorAll(".rupiah").forEach((i) => {
      i.value = formatRupiah(i.value);
    });
    document.querySelectorAll(".desimal").forEach((i) => {
      i.value = i.value.replace(".", ",");
    });
  };
}

function hapusData(id) {
  if (!confirm(`Hapus data ini?`)) return;
  const tx = db.transaction("produk", "readwrite");
  const store = tx.objectStore("produk");
  store.delete(id);
  tx.oncomplete = tampilkanData;
}

// --- Fungsi bantu perhitungan dan tampilan ---
function hitungHarga(
  modal,
  berat,
  kemasan,
  laba,
  diskon,
  proses,
  ongkir,
  fee
) {
  modal = Number(modal) || 0;
  berat = Number(berat) || 0;
  kemasan = Number(kemasan) || 0;
  laba = Number(laba) || 0;
  diskon = Number(diskon) || 0;
  proses = Number(proses) || 0;
  ongkir = Number(ongkir) || 0;
  fee = Number(fee) || 0;
  const modalTotal = modal * berat + kemasan;
  const multiplierLaba = 1 + laba / 100;
  const sisaDiskon = 1 - diskon / 100;
  const sisaFee = 1 - fee / 100;
  const hargaJual =
    (modalTotal * multiplierLaba + proses + ongkir) / (sisaDiskon * sisaFee);
  const hargaAkhir = hargaJual * sisaDiskon;
  const saldoMasuk = hargaAkhir * sisaFee - proses - ongkir;
  const labaBersih = saldoMasuk - modalTotal;
  return { modalTotal, hargaJual, hargaAkhir, saldoMasuk, labaBersih };
}

function fmt(n) {
  if (isNaN(n) || n === null) return "-";
  return Number(n).toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

// --- Modal form ---
// Enter untuk pindah input, Enter di input terakhir untuk submit
const formInputs = document.querySelectorAll(".form-box input");
formInputs.forEach((input, index) => {
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault(); // cegah default submit form
      const next = formInputs[index + 1];
      if (next) {
        next.focus(); // pindah ke input berikutnya
      } else {
        // Kalau ini input terakhir → langsung proses submit
        document.getElementById("btnSimpan").click();
      }
    }
  });
});
document.getElementById("btnSimpan").addEventListener("click", tambahData);
document.getElementById("openModal").addEventListener("click", openModal);
document.getElementById("closeModal").addEventListener("click", closeModal);

function openModal() {
  document.querySelector(".form-container").classList.add("show");
  document.body.classList.add("notscroll");
}

function closeModal() {
	editIndex = null;
  document.querySelector(".form-box h3").textContent =
    "Tambah Produk Baru";
  document.getElementById("btnSimpan").textContent = "Simpan";
  document.querySelector(".form-container").classList.remove("show");
  document.body.classList.remove("notscroll");
  document.querySelectorAll("input").forEach((i) => (i.value = ""));
document.querySelectorAll(".info").forEach((i) => (i.innerHTML = ""));
}

function formatRupiah(angka) {
  const num = angka.replace(/[^\d]/g, ""); // hapus semua karakter non-digit
  return num ? num.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
}

document.querySelectorAll(".rupiah").forEach((input) => {
  input.addEventListener("input", (e) => {
    const posisiKursor = e.target.selectionStart;
    const nilaiAwal = e.target.value;
    e.target.value = formatRupiah(e.target.value);
    const selisih = e.target.value.length - nilaiAwal.length;
    e.target.setSelectionRange(
      posisiKursor + selisih,
      posisiKursor + selisih
    );
  });
  input.addEventListener("blur", (e) => {
    e.target.value = formatRupiah(e.target.value);
  });
});

document.querySelectorAll(".desimal").forEach((input) => {
  input.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(".", ",");
  });
});

function toNumber(str) {
  if (!str) return 0;
  // Hilangkan semua spasi
  str = str.trim();
  // Kalau mengandung koma desimal → ganti jadi titik
  if (str.includes(",")) {
    // Hilangkan titik ribuan dulu
    str = str.replace(/\./g, "");
    // Ganti koma jadi titik
    str = str.replace(",", ".");
  } else {
    // Kalau tidak ada koma, berarti angka rupiah biasa
    str = str.replace(/\./g, "");
  }
  return parseFloat(str) || 0;
}

function openSearch(e) {
	e.stopPropagation();
	const searchBox = document.getElementById("searchBox");
	const inputSearch = document.getElementById("inputSearch");
	const closeSearch = document.getElementById("closeSearch");
	searchBox.classList.add("show");
	inputSearch.focus();
	inputSearch.addEventListener("input", () => {
		if (inputSearch.value.length > 1) {
			closeSearch.classList.add("active");
		} else {
			closeSearch.classList.remove("active");
		}
		cariProdukIndexedDB(inputSearch.value);
	});
	document.addEventListener("click", (e) => {
		if (!(e.target instanceof Node)) return;
		if (searchBox && !searchBox.contains(e.target)) {
			inputSearch.value = "";
			searchBox.classList.remove("show");
			//tampilkanData();
		}
	});
}

function dataResult(data) {
	const tbody = document.querySelector("#tabelData tbody");
	const notData = document.getElementById("notData");
	tbody.innerHTML = "";
	if (data.length > 0) {
		data.forEach((d, i) => {
			tbody.innerHTML += `
	      <tr data-id="${d.id}">
	        <td>${i + 1}</td>
	        <td>${d.produk}</td>
	        <td>${d.berat}</td>
	        <td>${fmt(d.modal)}</td>
	        <td>${fmt(d.kemasan)}</td>
	        <td>${fmt(d.proses)}</td>
	        <td>${fmt(d.ongkir)}</td>
	        <td>${d.laba}</td>
	        <td>${d.diskon}</td>
	        <td>${d.fee}</td>
	        <td>${fmt(d.modalTotal)}</td>
	        <td>${fmt(d.hargaJual)}</td>
	        <td>${fmt(d.hargaAkhir)}</td>
	        <td>${fmt(d.saldoMasuk)}</td>
	        <td>${fmt(d.labaBersih)}</td>
	        <td>${d.tanggalSekarang}</td>
	        <td><button class="edit-btn" title="Edit Data" onclick="editData(${
	          d.id
	        })"><i class="fa-solid fa-pen"></i></button></td>
	        <td><button class="delete-btn" title="Hapus Data" onclick="hapusData(${
	          d.id
	        })"><i class="fa-solid fa-trash"></i></button></td>
	      </tr>
			`;
		});
		notData.classList.remove("show");
	} else if (data.length === 0) {
		notData.classList.add("show");
	}
}

function cariProdukIndexedDB(keyword) {
  const transaction = db.transaction("produk", "readonly");
  const store = transaction.objectStore("produk");
  const request = store.getAll();
  request.onsuccess = function () {
    const hasil = request.result.filter(p => p.produk.toLowerCase().includes(keyword.toLowerCase()));
		const data = hasil.sort((a, b) => b.id - a.id);
		//tampilkan hasil ke tabel
		if (keyword.length > 2) {
			dataResult(data);
		} else if (keyword.length === 0) {
			tampilkanData();
		}
  };
}

function closeSearch() {
	document.getElementById("searchBox").classList.remove("show");
	document.getElementById("inputSearch").value = "";
	tampilkanData();
}

document.getElementById("openSearch").addEventListener("click", openSearch);
document.getElementById("closeSearch").addEventListener("click", closeSearch);

function openGenerate() {
  document.querySelector(".generate").classList.add("show");
  document.body.classList.add("notscroll");
}

function closeGenerate() {
  document.querySelector(".generate").classList.remove("show");
  document.body.classList.remove("notscroll");
  resetText();
}

function pilihNama() {
  const inp = document.getElementById("namaDes");
  const opt = document.getElementById("selectNama");
  // Ambil semua opsi yang dipilih dan gabungkan dengan tanda koma
  const selected = Array.from(opt.selectedOptions).map(o => o.value).join(" / ");
  inp.value = selected;
}

function pilihKualitas() {
  const inp = document.getElementById("kualitasDes");
  const opt = document.getElementById("selectKualitas");
  // Ambil semua opsi yang dipilih dan gabungkan dengan tanda koma
  const selected = Array.from(opt.selectedOptions).map(o => o.value).join(", ");
  inp.value = selected;
}

function pilihVarian() {
  const inp = document.getElementById("varianDes");
  const opt = document.getElementById("selectVarian");
  // Ambil semua opsi yang dipilih dan gabungkan dengan garis miring
  const selected = Array.from(opt.selectedOptions).map(o => o.value).join(" / ");
  inp.value = selected;
}

function pilihTekstur() {
  const inp = document.getElementById("teksturDes");
  const opt = document.getElementById("selectTekstur");
  // Ambil semua opsi yang dipilih dan gabungkan dengan tanda koma
  const selected = Array.from(opt.selectedOptions).map(o => o.value).join(", ");
  inp.value = selected;
}

function pilihAroma() {
  const inp = document.getElementById("aromaDes");
  const opt = document.getElementById("selectAroma");
  // Ambil semua opsi yang dipilih dan gabungkan dengan tanda koma
  const selected = Array.from(opt.selectedOptions).map(o => o.value).join(" / ");
  inp.value = selected;
}

function pilihButiran() {
  const inp = document.getElementById("butiranDes");
  const opt = document.getElementById("selectButiran");
  // Ambil semua opsi yang dipilih dan gabungkan dengan tanda koma
  const selected = Array.from(opt.selectedOptions).map(o => o.value).join(" / ");
  inp.value = selected;
}

function pilihKemasan() {
  const inp = document.getElementById("kemasanDes");
  const opt = document.getElementById("selectKemasan");
  // Ambil semua opsi yang dipilih dan gabungkan dengan tanda koma
  const selected = Array.from(opt.selectedOptions).map(o => o.value).join(" / ");
  inp.value = selected;
}

function pilihToko() {
  const inp = document.getElementById("tokoDes");
  const opt = document.getElementById("selectToko");
  // Ambil semua opsi yang dipilih dan gabungkan dengan tanda koma
  const selected = Array.from(opt.selectedOptions).map(o => o.value).join(" / ");
  inp.value = selected;
}

function pilihKeunggulan() {
  const inp = document.getElementById("keunggulanDes");
  const opt = document.getElementById("selectKeunggulan");
  // Ambil semua opsi yang dipilih dan gabungkan dengan tanda koma
  const selected = Array.from(opt.selectedOptions).map(o => o.value.replace(/\,/g, ".")).join(", ");
  inp.value = selected;
}

function buatDeskripsi(event) {
  event.preventDefault();
  const nama = document.getElementById("namaDes").value.trim();
  const kualitas = document.getElementById("kualitasDes").value.trim();
  const varian = document.getElementById("varianDes").value.trim();
  const tekstur = document.getElementById("teksturDes").value.trim();
  const aroma = document.getElementById("aromaDes").value.trim();
  const butiran = document.getElementById("butiranDes").value.trim();
  const kemasan = document.getElementById("kemasanDes").value.trim();
  const toko = document.getElementById("tokoDes").value.trim();
  const keunggulan = document.getElementById("keunggulanDes").value.split(",").map(x => x.trim()).filter(Boolean);
  const hasil = `
🌾 ${nama} ${varian} - ${kualitas}

Selamat datang di ${toko}, pusat kebutuhan beras terpercaya di daerahmu!
Kami menyediakan ${nama} dengan kualitas terbaik dan harga jujur.

---

🍚 Deskripsi Produk
• Merek: ${nama}
• Varian Berat: ${varian}
• Tekstur Nasi: ${tekstur}
• Aroma: ${aroma}
• Butiran: ${butiran}
• Kemasan: ${kemasan}
• Kondisi: Baru & siap kirim
• Kualitas: 100% beras murni pilihan tanpa pemutih, pewangi, atau pengawet

🧺 Kelebihan Produk
${keunggulan.map(k => `✅ ${k.replace(/\./g, ",")}`).join('\n')}

---

⚠️ Syarat Komplain
Harap sertakan video unboxing lengkap saat membuka paket.
Tanpa video, komplain tidak dapat diproses.

---

🕒 Jam Operasional
Senin - Sabtu : 07.00 - 20.00 WIB
(Minggu & libur nasional tetap melayani pesanan online)

🚚 Layanan Pengiriman
Pengiriman cepat ke seluruh area sekitar.
Bisa antar langsung ke rumah atau tempat usaha kamu.

---

✨ Klik “Beli Sekarang” dan rasakan kualitas beras terbaik dari ${toko}!
#${nama.replace(/\s+/g, '')} #${toko.replace(/\s+/g, '')} #${kualitas.replace(/\s+/g, '')} #BerasPulen #TokoBeras #BerasPremium #AndaPuasKamiSenang
  `.trim();
  document.getElementById("hasil").value = hasil;
}

function resetText() {
	document.querySelectorAll(".generate form input").forEach((i) => { i.value = "" });
	document.querySelectorAll(".generate form select option").forEach((i) => { i.selected = false});
	document.getElementById("hasil").value = "";
}

function copyText() {
  const isi = document.getElementById("hasil").value;
  if (!isi.trim()) {
    alert("Belum ada teks untuk disalin!");
    return;
  }
  // Coba metode modern
  navigator.clipboard.writeText(isi).then(() => {
    alert("Deskripsi berhasil disalin!");
  }).catch(() => {
    // Fallback untuk browser lama
    const textarea = document.createElement("textarea");
    textarea.value = isi;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      alert("Deskripsi berhasil disalin!");
    } catch (err) {
      alert("Maaf, terjadi kesalahan saat menyalin teks.");
    }
    document.body.removeChild(textarea);
  });
}

document.getElementById("openGenerate").addEventListener("click", openGenerate);
document.getElementById("closeGenerate").addEventListener("click", closeGenerate);

// bagian pengguna
// fungsi check login
function checkLogin() {
	const formUser = document.querySelector(".form-user");
	const loggedIn = sessionStorage.getItem("loggedInUser");
	if (loggedIn) {
		formUser.classList.add("hidden");
	} else {
		formUser.classList.remove("hidden");
	}
}

// check login
window.onload = () => {
	checkLogin();
	setTimeout(() => document.querySelector(".loader").classList.add("hidden"), 500);
}

// fungsi buka tutup password
function showHidePass() {
	const pass = document.getElementById("password");
	const posEnd = document.querySelector(".pos-end i");
	if (pass.type === "password") {
		pass.type = "text";
		posEnd.classList.remove("fa-eye-slash");
		posEnd.classList.add("fa-eye");
	} else {
		pass.type = "password";
		posEnd.classList.remove("fa-eye");
		posEnd.classList.add("fa-eye-slash");
	}
}

// fungsi proses data user
function processDataUser(username, password, targetRule) {
	const formUser = document.querySelector('.form-user')
	const input = document.querySelectorAll("#formLogin input");
	const infoError = document.querySelectorAll("#formLogin .info-text");
	infoError.forEach((ie) => ie.textContent = "");
	if (targetRule === "akses login") {
		const user = users.find(u => u.username === username);
		const pass = users.find(p => p.password === password);
		if (!user) {
			input[0].focus();
			infoError[0].textContent = "Username salah!";
			return;
		}
		if (!pass) {
			input[1].focus();
			infoError[1].textContent = "Password salah!";
			return;
		}
		formUser.classList.add("hidden");
		sessionStorage.setItem("loggedInUser", JSON.stringify(user));
	} else if (targetRule === "buat akun") {
		const mhk = "Minimal mengandung 1 huruf kecil!";
		const mhb = "Minimal mengandung 1 huruf besar!";
		const msa = "Minimal mengandung 1 angka!";
		if (users.find(u => u.username === username)) {
			input[0].focus();
			infoError[0].textContent = "Username sudah digunakan!";
			return;
		}
		if (!password.match(/[a-z]/)) {
			input[1].focus(), infoError[1].textContent = mhk;
			return;
		}
		if (!password.match(/[A-Z]/)) {
			input[1].focus(), infoError[1].textContent = mhb;
			return;
		}
		if (!password.match(/[0-9]/)) {
			input[1].focus(), infoError[1].textContent = msa;
			return;
		}
		users.push({ username, password });
		localStorage.setItem("users", JSON.stringify(users));
		alert("Akun berhasi disimpan, silakan login.");
	}
}

// fungsi validasi form user
function validasiFormUser(e) {
	e.preventDefault();
	const formLogin = document.getElementById("formLogin");
	const user = document.getElementById("username");
	const pass = document.getElementById("password");
	const btnLogin = document.getElementById("btnLogin");
	const targetRule = btnLogin.getAttribute("target-rule");
	 const infoError = formLogin.querySelectorAll(".info-text");
	 infoError[0].textContent = "";
	 infoError[1].textContent = "";
	 if (user.value === "") {
	 	user.focus();
	 	infoError[0].textContent = "Masukkan username!";
	 } else if (pass.value === "") {
	 	pass.focus();
	 	infoError[1].textContent = "Masukkan password!";
	 } else {
	 	processDataUser(user.value, pass.value, targetRule);
	 }
}

// fungsi buat akun
function buatAkun() {
	const titlePage = document.getElementById("titlePage");
	const btnLogin = document.getElementById("btnLogin");
	const infoLogin = document.getElementById("infoLogin");
	const buatAkun = document.getElementById("buatAkun");
	const input = document.querySelectorAll("#formLogin input");
	const posEnd = document.querySelector(".pos-end i");
	
	input.forEach((inp) => inp.value = "");
	
	document.querySelectorAll("#formLogin .info-text").forEach((ie) => ie.textContent = "");
	
	if (input[1].type === "text") {
		input[1].type = "password";
		posEnd.classList.remove("fa-eye");
		posEnd.classList.add("fa-eye-slash");
	}
	
	if (buatAkun.textContent.includes("Daftar disini")) {
		titlePage.innerHTML = titlePage.innerHTML.replace("Login", "Buat Akun");
		btnLogin.textContent = "Daftar Sekarang";
		infoLogin.textContent = "Sudah";
		buatAkun.textContent = "Login disini";
		btnLogin.setAttribute("target-rule", "buat akun");
	} else {
		titlePage.innerHTML = titlePage.innerHTML.replace("Buat Akun", "Login");
		btnLogin.textContent = "Login";
		infoLogin.textContent = "Belum";
		buatAkun.textContent = "Daftar disini";
		btnLogin.setAttribute("target-rule", "akses login");
	}
}

// fungsi logout user
function logoutUser() {
	if (!confirm("Yakin ingin logout?")) return false;
	sessionStorage.removeItem("loggedInUser");
	const formUser = document.querySelector(".form-user").classList.remove("hidden");
}

document.getElementById("btnLogin").addEventListener("click", validasiFormUser);
document.getElementById("buatAkun").addEventListener("click", buatAkun);
document.getElementById("logoutUser").addEventListener("click", logoutUser);