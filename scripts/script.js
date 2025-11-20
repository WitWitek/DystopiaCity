var budynki=new Array();
const obrazyMieszkalne = [];

for (let i = 0; i <= 5; i++) {
    const img = new Image();
    img.src = `grafika/m${i}.png`;
    obrazyMieszkalne[i] = img;
}
const obrazyKomercyjne = [];

for (let i = 0; i <= 5; i++) {
    const img = new Image();
    img.src = `grafika/k${i}.png`;
    obrazyKomercyjne[i] = img;
}
const obrazyPrzemyslowe = [];

for (let i = 0; i <= 5; i++) {
    const img = new Image();
    img.src = `grafika/p${i}.png`;
    obrazyPrzemyslowe[i] = img;
}
const obrazyOchrony = [];

for (let i = 0; i <= 5; i++) {
    const img = new Image();
    img.src = `grafika/o${i}.png`;
    obrazyOchrony[i] = img;
}
const dron=new Image();;

dron.src = `grafika/dron.png`;
   let TILE = 25; // domyślnie
function przeliczRozmiarTila() {
    const docWidth = window.innerWidth;
    const docHeight = window.innerHeight;

    const maxKafelkiX = 20; // ile kafelków ma się mieścić w poziomie
    const maxKafelkiY = 12; // ile w pionie

    TILE = Math.floor(Math.min(docWidth / maxKafelkiX, docHeight / maxKafelkiY));
}
const muzykaTlo = new Audio("audio/muzyka.wav");
muzykaTlo.loop = true;
muzykaTlo.volume = 0.4;
var graZakonczona = false;
let interwalUpgrade ;
let interwalAnimacji;

// Odpal po pierwszym kliknięciu (np. wyborze frakcji)
function uruchomMuzyke() {
    muzykaTlo.play().catch(() => {
        console.log("Autoodtwarzanie zablokowane, gra uruchomi muzykę przy interakcji.");
    });
}
const dzwiekKlik = new Audio("audio/buttonClick.wav");

function klikniecieDzwiek() {
    dzwiekKlik.currentTime = 0;
    dzwiekKlik.play();
}
var canvas=0;
var context=0;
var mx=0;
var my=0;
var szerokoscMiasta=50
var wysokoscMiasta=50
var ustawieniaBudynku=false;
var globalnyProfitZielony=0;
var globalnyProfitCzerwony=0
var globalnyProfitNiebieski=0;
var globalnyProfitZolty=0
var globalnePieniadzeZielone=0
var globalnePieniadzeCzerwone=0
var globalnePieniadzeNiebieskie=0
var globalnePieniadzeZolte=0
var indeksyZielone=new Array();
var indeksyCzerwone=new Array();
var indeksyNiebieskie=new Array();
var indeksyZolte=new Array();
var aktualnyNajnizszyPoziomCzerwony=0;
var aktualnyNajnizszyPoziomZielony=0;
var aktualnyNajnizszyPoziomNiebieski=0;
var aktualnyNajnizszyPoziomZolty=0;
 var oddzialy=new Array();
var scrollX=0
var scrollY=0
var wybranyBudynek = null;
var frakcjaGracza = null; // ustawiane przez wybór gracza

const celeZajete = new Set(); // przechowuje ID budynków, które są już celem
const celePrzeciwnikowZajete = new Map(); // wróg.id → licznik oddziałów przypisanych
function zatrzymajGre() {
    clearInterval(interwalUpgrade);
    clearInterval(interwalAnimacji);

    // Dodatkowo możesz np. ukryć panel lub zablokować kliknięcia
    document.getElementById("panelBudynku").style.display = "none";
    alert("Game over.");
}

function przeliczWysokoscCanvas() {
    const naglowek = document.querySelector("h1")?.offsetHeight || 0;
    const frakcje = document.getElementById("frakcje-info")?.offsetHeight || 0;
    const stopka = document.getElementById("stopka")?.offsetHeight || 0;

    const wysokosc = window.innerHeight - naglowek - frakcje - stopka - 40;

    canvas.height = wysokosc;
}
window.addEventListener("resize", przeliczWysokoscCanvas);
przeliczWysokoscCanvas();
function policzBudynkiOchrony(kolorFrakcji) {
    return budynki.filter(b =>
        b instanceof budynekOchrony &&
        (b.kolor === kolorFrakcji || kolorDoFrakcji(b.kolor) === kolorFrakcji)
    ).length;
}
function przeksztalcNaOchrone() {
    if (!wybranyBudynek || wybranyBudynek instanceof budynekOchrony) return;

    const kolor = wybranyBudynek.kolor;
    const frakcja = kolorDoFrakcji(kolor);
    const ileOchron = policzBudynkiOchrony(frakcja);
    const koszt = 100000 * Math.pow(2, ileOchron);

    let kasa = {
        green: globalnePieniadzeZielone,
        red: globalnePieniadzeCzerwone,
        blue: globalnePieniadzeNiebieskie,
        yellow: globalnePieniadzeZolte
    }[frakcja];

    if (kasa < koszt) {
        alert(`❌ Not enough money. You need ${koszt.toLocaleString()} $`);
        return;
    }

    // Potwierdzenie
    if (!confirm(`Conversion cost is ${koszt.toLocaleString()} $. Continue?`)) return;

    // Odejmij
    switch (frakcja) {
        case "green": globalnePieniadzeZielone -= koszt; break;
        case "red": globalnePieniadzeCzerwone -= koszt; break;
        case "blue": globalnePieniadzeNiebieskie -= koszt; break;
        case "yellow": globalnePieniadzeZolte -= koszt; break;
    }

    const index = wybranyBudynek.id;
    const nowy = new budynekOchrony(index, wybranyBudynek.obraz, wybranyBudynek.x, wybranyBudynek.y, 4*TILE, -2, kolor);
    budynki[index] = nowy;
    nowy.sprawdzKlientow();

    alert("✅ Building converted into Security!");
    pokazPanel(nowy); // odśwież panel
}

function przeksztalcWBudynekOchrony(index, kolor) {
    const stary = budynki[index];
    if (!stary) return;

    const frakcja = kolorDoFrakcji(kolor);
    const ileOchron = policzBudynkiOchrony(frakcja);
    const koszt = 100000 * Math.pow(2, ileOchron);

    // Sprawdź środki
    if ((frakcja === "green" && globalnePieniadzeZielone < koszt) ||
        (frakcja === "red" && globalnePieniadzeCzerwone < koszt) ||
        (frakcja === "blue" && globalnePieniadzeNiebieskie < koszt) ||
        (frakcja === "yellow" && globalnePieniadzeZolte < koszt)) {
        alert(`❌ faction ${frakcja} doesn't have ${koszt.toLocaleString()} $ for rebuilding into Security`);
        return;
    }

    // Odejmij pieniądze
    if (frakcja === "green") globalnePieniadzeZielone -= koszt;
    if (frakcja === "red") globalnePieniadzeCzerwone -= koszt;
    if (frakcja === "blue") globalnePieniadzeNiebieskie -= koszt;
    if (frakcja === "yellow") globalnePieniadzeZolte -= koszt;

    // Przekształcenie
    const nowy = new budynekOchrony(index, stary.obraz, stary.x, stary.y, 4*TILE, -2, kolor);
    budynki[index] = nowy;
    nowy.sprawdzKlientow();
}

class budynek{
  
    constructor(id,obraz,x,y){
        this.obraz=obraz;
		this.captureProgress = 0;
        this.kolor="black";
        this.id=id;
        this.x=x;
        this.y=y;
        this.szerokosc=TILE;
        this.wysokosc=TILE;
        this.poziom=0;
        this.pokazanieDanych=false;
        //console.log("pokazanieDanych "+this.pokazanieDanych);
    }
	obliczZyskDlaFrakcji() {
    let bazowy = this.profit || 0;
    const frakcja = kolorDoFrakcji(this.kolor);

    if (this instanceof budynekMieszkalny && frakcja === "mieszkalna") return bazowy * 2;
    if (this instanceof budynekKomercyjny && frakcja === "komercyjna") return bazowy * 2;
    if (this instanceof budynekPrzemyslowy && frakcja === "przemyslowa") return bazowy + 200;
    if (frakcja === "naukowa") return bazowy * 1.1;

    return bazowy;
}

    pokazUkryjDane(){
        this.pokazanieDanych=!this.pokazanieDanych;
    }
    rysuj(){
        context.strokeStyle=this.kolor
        context.strokeRect(this.x,this.y,this.szerokosc,this.wysokosc)
        context.strokeStyle="black"
    }
}
class budynekMieszkalny extends budynek {
    constructor(id,obraz,x,y,populacja,czynsz){
        super(id,obraz,x,y);
        this.populacja=populacja;
        this.czynszZaOsobe=czynsz;
       // this.profit=this.czynszZaOsobe*this.populacja;
    }
    aktualizujProfit(){
        this.profit=this.czynszZaOsobe*this.populacja;
    }
rysuj() {
    const poziom = Math.min(Math.max(this.poziom || 0, 0), 5); // bezpieczne ograniczenie
    const x = this.x + scrollX;
    const y = this.y + scrollY;
    const szer = this.szerokosc;
    const wys = this.wysokosc;

    // rysowanie budynku
    const img = obrazyMieszkalne[poziom];
    if (img.complete) {
        context.drawImage(img, x, y, szer, wys);
    } else {
        img.onload = () => context.drawImage(img, x, y, szer, wys);
    }
context.globalAlpha = 0.3;
context.fillStyle = this.kolor;
context.fillRect(x, y, this.szerokosc, this.wysokosc);
context.globalAlpha = 1.0;

    // ramka z kolorem frakcji
    context.strokeStyle = this.kolor;
    context.lineWidth = 2;
    context.strokeRect(x, y, szer, wys);

    // tekst poziomu
    //context.fillStyle = "white";
   // context.font = "10px Arial";
   // context.fillText(`${poziom}M`, x + szer / 2 - 5, y + wys / 2 + 3);

    // panel informacyjny
    if (this.pokazanieDanych) {
        pokazPanel(this);
    }

    context.strokeStyle = "black"; // reset
    context.lineWidth = 1;
}


    aktualizuj(){
     switch(this.poziom){
		 case 0:
         this.populacja=30
         break;
         case 1:
         this.populacja=50
         break;
         case 2:
         this.populacja=70
         break;
         case 3:
         this.populacja=100;
         break;
         case 4:
         this.populacja=150;
         break;
         case 5:
         this.populacja=230;
         break;
     }   
    }
    upgrade(){
        switch(this.kolor){
            case "red":
			 case "pink":
            if(globalnePieniadzeCzerwone>=3000+1000*this.poziom&&this.poziom<5){
                globalnePieniadzeCzerwone-=3000+1000*this.poziom;
                this.poziom++
            }
            break;
            case"green":
			case"darkGreen":
            if(globalnePieniadzeZielone>=3000+1000*this.poziom&&this.poziom<5){
                globalnePieniadzeZielone-=3000+1000*this.poziom
                this.poziom++
            }
            break;
			 case"blue":
			case"purple":
            if(globalnePieniadzeNiebieskie>=3000+1000*this.poziom&&this.poziom<5){
                globalnePieniadzeNiebieskie-=3000+1000*this.poziom
                this.poziom++
            }
            break;
			 case"yellow":
			case"orange":
            if(globalnePieniadzeZolte>=3000+1000*this.poziom&&this.poziom<5){
                globalnePieniadzeZolte-=3000+1000*this.poziom
                this.poziom++
            }
            break;
            
        }
         this.aktualizuj();   
		 this.aktualizujProfit();
        
    }
}
class budynekKomercyjny extends budynek{
    
    constructor(id,obraz,x,y,zasieg,zyskNaKlienta){
        super(id,obraz,x,y)
        this.kolor="black";
        this.zasieg=zasieg;
        this.zyskNaKlienta=zyskNaKlienta;
        this.klienci=0;
        this.populacja=0;
         
      // if(this.id+1>0&&this.id+1<budynki.length)this.klienci+=budynki[this.id+1].populacja
      // if(this.id-1>0&&this.id-1<budynki.length) this.klienci+=budynki[this.id-1].populacja
       // if(this.id+szerokoscMiasta>0&&this.id+szerokoscMiasta<budynki.length)this.klienci+=budynki[this.id+szerokoscMiasta].populacja
       // if(this.id-szerokoscMiasta>0&&this.id-szerokoscMiasta<budynki.length)this.klienci+=budynki[this.id-szerokoscMiasta].populacja
       
       // this.profit=this.klienci*this.zyskNaKlienta

        
    }
    aktualizujProfit(){
        
    this.profit = this.klienci * this.zyskNaKlienta;
    console.log(`[${this.id}] Klienci: ${this.klienci}, Zysk: ${this.profit}`);


    }
   sprawdzKlientow(){
	   
    let tablica = [];

   const frakcja = kolorDoFrakcji(this.kolor);
switch (frakcja) {
    case "komercyjna":
        tablica = indeksyCzerwone; break;
    case "mieszkalna":
        tablica = indeksyZielone; break;
    case "naukowa":
        tablica = indeksyNiebieskie; break;
    case "przemyslowa":
        tablica = indeksyZolte; break;
    default:
        tablica = [];
}


    if (!Array.isArray(tablica)) return; // dodatkowe zabezpieczenie

    this.klienci = 0;
console.log("Sprawdzam klientów dla:", this.id, "Kolor:", this.kolor, "Zasięg:", this.zasieg);
console.log("Tablica klientów:", tablica);

    for (let i = 0; i < tablica.length; i++) {
        const klient = budynki[tablica[i]];
        if (!klient || klient.populacja === undefined) continue;

        const dx = (klient.x + klient.szerokosc / 2) - (this.x + this.szerokosc / 2);
        const dy = (klient.y + klient.wysokosc / 2) - (this.y + this.wysokosc / 2);
        const dystans = Math.sqrt(dx * dx + dy * dy);

        if (dystans < this.zasieg) {
            this.klienci += klient.populacja;
        }
    }
}



    aktualizuj(){
        switch(this.poziom){
			case 0:
            this.zyskNaKlienta=7
            break;
            case 1:
            this.zyskNaKlienta=10
            break;
            case 2:
            this.zyskNaKlienta=13;
            break;
            case 3:
            this.zyskNaKlienta=18
            break;
            case 4:
            this.zyskNaKlienta=25;
            break;
            case 5:
            this.zyskNaKlienta=35;
            break;
        }
    }
upgrade() {
    switch(this.kolor){
        case "red":
        case "pink":
            if(globalnePieniadzeCzerwone >= 5000 + 1500 * this.poziom && this.poziom < 5){
                globalnePieniadzeCzerwone -= 5000 + 1500 * this.poziom;
                this.poziom++;
            }
            break;
        case "green":
        case "darkGreen":
            if(globalnePieniadzeZielone >= 5000 + 1500 * this.poziom && this.poziom < 5){
                globalnePieniadzeZielone -= 5000 + 1500 * this.poziom;
                this.poziom++;
            }
            break;
        case "blue":
        case "purple":
            if(globalnePieniadzeNiebieskie >= 5000 + 1500 * this.poziom && this.poziom < 5){
                globalnePieniadzeNiebieskie -= 5000 + 1500 * this.poziom;
                this.poziom++;
            }
            break;
        case "yellow":
        case "orange":
            if(globalnePieniadzeZolte >= 5000 + 1500 * this.poziom && this.poziom < 5){
                globalnePieniadzeZolte -= 5000 + 1500 * this.poziom;
                this.poziom++;
            }
            break;
    }
    this.aktualizuj();             // zmienia zyskNaKlienta
    this.sprawdzKlientow();        // aktualizuje this.klienci
    this.aktualizujProfit();       // 🔁 przelicza this.profit
}

   rysuj() {
    const poziom = Math.min(Math.max(this.poziom || 0, 0), 5);
    const x = this.x + scrollX;
    const y = this.y + scrollY;
    const szer = this.szerokosc;
    const wys = this.wysokosc;

    const img = obrazyKomercyjne[poziom];
    if (img.complete) {
        context.drawImage(img, x, y, szer, wys);
    } else {
        img.onload = () => context.drawImage(img, x, y, szer, wys);
    }
	context.globalAlpha = 0.3;
context.fillStyle = this.kolor;
context.fillRect(x, y, this.szerokosc, this.wysokosc);
context.globalAlpha = 1.0;

    // ramka frakcji
    context.strokeStyle = this.kolor;
    context.lineWidth = 2;
    context.strokeRect(x, y, szer, wys);

    // poziom jako tekst
    //context.fillStyle = "white";
    //context.font = "10px Arial";
    //context.fillText(`${poziom}K`, x + szer / 2 - 5, y + wys / 2 + 3);

    // rysowanie zasięgu
    if (this.pokazanieDanych) {
      

        pokazPanel(this);
    }

    context.strokeStyle = "black";
    context.lineWidth = 1;
}
rysujZasieg() {
    const x = this.x + this.szerokosc / 2 + scrollX;
    const y = this.y + this.wysokosc / 2 + scrollY;

    // Wypełnienie (półprzezroczyste)
    context.save();
    context.globalAlpha = 0.2;
    context.beginPath();
    context.arc(x, y, this.zasieg, 0, 2 * Math.PI);
    context.fillStyle = this.kolor;
    context.fill();
    context.closePath();

    // Obramowanie (pełne krycie)
    context.globalAlpha = 1.0;
    context.strokeStyle = this.kolor;
    context.lineWidth = 1;
    context.stroke();

    context.restore();
}

}
class budynekOchrony extends budynekKomercyjny{
    constructor(id,obraz,x,y,zasieg,utrzymanie,kolor){
      super(id,obraz,x,y,zasieg,utrzymanie)  
        this.kolor=kolor;
    }
    aktualizujProfit(){
        this.profit=this.zyskNaKlienta*this.klienci
    }
    sprawdzKlientow(){
        this.klienci=0;
             //  if(indeksPoczatkowy<0)indeksPoczatkowy=0;
       // indeksPoczatkowy=0
        //indeksKoncowy=budynki.length-1;
        
        for(var i=0,len=budynki.length;i<len;i++){
                var a=Math.abs((budynki[i].x+budynki[i].szerokosc/2)-(this.x+this.szerokosc/2))
                var b=Math.abs((budynki[i].y+budynki[i].wysokosc/2)-(this.y+this.wysokosc/2))

                if(Math.sqrt(a*a+b*b)<this.zasieg){
                    this.klienci+=budynki[i].populacja
                    if(budynki[i].kolor=="black"&&this.kolor=="orange")budynki[i].kolor="yellow";
                    if(budynki[i].kolor=="black"&&this.kolor=="pink")budynki[i].kolor="red"
                    if(budynki[i].kolor=="black"&&this.kolor=="purple")budynki[i].kolor="blue"
                    if(budynki[i].kolor=="black"&&this.kolor=="darkGreen")budynki[i].kolor="green"
                  }
        }
      //  console.log("klienci "+this.klienci)
        this.profit=this.klienci*this.zyskNaKlienta;
    }
    aktualizuj(){
        switch(this.poziom){
			case 0:
            this.zyskNaKlienta=-3
            break;
            case 1:
            this.zyskNaKlienta=-2
            break;
            case 2:
            this.zyskNaKlienta=-1
            break;
            case 3:
            this.zyskNaKlienta=0
            break;
            case 4:
            this.zyskNaKlienta=2
            break;
            case 5:
            this.zyskNaKlienta=5
            break
            
        }
    }
    upgrade(){
        switch(this.kolor){
			case"red":
            case"pink":
            if(globalnePieniadzeCzerwone>=7000+2000*this.poziom&&this.poziom<5){
                globalnePieniadzeCzerwone-=7000+2000*this.poziom;
                this.poziom++;
            }
            break;
			case"green":
            case"darkGreen":
            if(globalnePieniadzeZielone>=7000+2000*this.poziom&&this.poziom<5){
                globalnePieniadzeZielone-=7000+2000*this.poziom;
                this.poziom++;
            }
            break;
				 case"blue":
			case"purple":
             if(globalnePieniadzeNiebieskie>=7000+2000*this.poziom&&this.poziom<5){
                globalnePieniadzeNiebieskie-=7000+2000*this.poziom;
                this.poziom++;
            }
            break;
			 case"yellow":
			case"orange":
              if(globalnePieniadzeZolte>=7000+2000*this.poziom&&this.poziom<5){
                globalnePieniadzeZolte-=7000+2000*this.poziom;
                this.poziom++;
            }
            break;
        }
        this.aktualizuj()
        this.sprawdzKlientow();
    }
   rysuj() {
    const poziom = Math.min(Math.max(this.poziom || 0, 0), 5);
    const x = this.x + scrollX;
    const y = this.y + scrollY;
    const szer = this.szerokosc;
    const wys = this.wysokosc;

    const img = obrazyOchrony[poziom];
    if (img.complete) {
        context.drawImage(img, x, y, szer, wys);
    } else {
        img.onload = () => context.drawImage(img, x, y, szer, wys);
    }
context.globalAlpha = 0.3;
context.fillStyle = this.kolor;
context.fillRect(x, y, this.szerokosc, this.wysokosc);
context.globalAlpha = 1.0;

    // ramka
    context.strokeStyle = this.kolor;
    context.lineWidth = 2;
    context.strokeRect(x, y, szer, wys);

    // etykieta poziomu
    //context.fillStyle = "white";
    //context.font = "10px Arial";
    //context.fillText(`${poziom}O`, x + szer / 2 - 5, y + wys / 2 + 3);
//
    // zasięg
    if (this.pokazanieDanych) {
      

        pokazPanel(this);
    }

    context.strokeStyle = "black";
    context.lineWidth = 1;
}
rysujZasieg() {
    const x = this.x + this.szerokosc / 2 + scrollX;
    const y = this.y + this.wysokosc / 2 + scrollY;

    // Wypełnienie (półprzezroczyste)
    context.save();
    context.globalAlpha = 0.2;
    context.beginPath();
    context.arc(x, y, this.zasieg, 0, 2 * Math.PI);
    context.fillStyle = this.kolor;
    context.fill();
    context.closePath();

    // Obramowanie (pełne krycie)
    context.globalAlpha = 1.0;
    context.strokeStyle = this.kolor;
    context.lineWidth = 1;
    context.stroke();

    context.restore();
}



}
class budynekPrzemyslowy extends budynekKomercyjny{
    constructor(id,obraz,x,y,zasieg,zyskNaKlienta){
        super(id,obraz,x,y,zasieg,zyskNaKlienta);
        this.zyskPodstawowy=500;
    }
    aktualizujProfit(){
        this.profit=this.klienci*this.zyskNaKlienta+this.zyskPodstawowy
    }
    sprawdzKlientow(){
    let tablica = [];

    switch(this.kolor){
        case "red":
        case "pink":
            tablica = indeksyCzerwone;
            break;
        case "darkGreen":
        case "green":
            tablica = indeksyZielone;
            break;
        case "blue":
        case "purple":
            tablica = indeksyNiebieskie;
            break;
        case "yellow":
        case "orange":
            tablica = indeksyZolte;
            break;
        default:
            tablica = []; // zabezpieczenie
    }

    if (!Array.isArray(tablica)) return; // dodatkowe zabezpieczenie

    this.klienci = 0;

    for (let i = 0; i < tablica.length; i++) {
        const klient = budynki[tablica[i]];
        if (!klient || klient.populacja === undefined) continue;

        const dx = (klient.x + klient.szerokosc / 2) - (this.x + this.szerokosc / 2);
        const dy = (klient.y + klient.wysokosc / 2) - (this.y + this.wysokosc / 2);
        const dystans = Math.sqrt(dx * dx + dy * dy);

        if (dystans < this.zasieg) {
            this.klienci += klient.populacja;
        }
    }
}

    aktualizuj(){
        switch(this.poziom){
			 case 0:
            this.zyskNaKlienta=-5
            this.zyskPodstawowy=300
            break;
            case 1:
            this.zyskNaKlienta=-5
            this.zyskPodstawowy=500
            break;
            case 2:
            this.zyskNaKlienta=-4;
            this.zyskPodstawowy=600;
            break;
            case 3:
            this.zyskNaKlienta=-3;
            this.zyskPodstawowy=750;
            break;
            case 4:
            this.zyskNaKlienta=0
            this.zyskPodstawowy=950;
            break;
            case 5:
            this.zyskNaKlienta=2
            this.zyskPodstawowy=1250;
            break;
        }
    }
    upgrade(){
        switch(this.kolor){
            case "red":
			case "pink":
            if(globalnePieniadzeCzerwone>=6500+1200*this.poziom&&this.poziom<5){
               globalnePieniadzeCzerwone-=6500+1200*this.poziom
               this.poziom++ ;               
            }
            break;
            case "green":
			case "darkGreen":
            if(globalnePieniadzeZielone>=6500+1200*this.poziom&&this.poziom<5){
               globalnePieniadzeZielone-=6500+1200*this.poziom
                   this.poziom++;
               
            }
            break;
				 case"blue":
			case"purple":
            if(globalnePieniadzeNiebieskie>=6500+1200*this.poziom&&this.poziom<5){
               globalnePieniadzeNiebieskie-=6500+1200*this.poziom
                   this.poziom++;
               
            }
            break;
			 case"yellow":
			case"orange":
            if(globalnePieniadzeZolte>=6500+1200*this.poziom&&this.poziom<5){
               globalnePieniadzeZolte-=6500+1200*this.poziom
                   this.poziom++;
               
            }
            break;
        }
        this.aktualizuj();
        this.sprawdzKlientow();
		this.aktualizujProfit();
    }
rysuj() {
    const poziom = Math.min(Math.max(this.poziom || 0, 0), 5);
    const x = this.x + scrollX;
    const y = this.y + scrollY;
    const szer = this.szerokosc;
    const wys = this.wysokosc;

    const img = obrazyPrzemyslowe[poziom];
    if (img.complete) {
        context.drawImage(img, x, y, szer, wys);
    } else {
        img.onload = () => context.drawImage(img, x, y, szer, wys);
    }
context.globalAlpha = 0.3;
context.fillStyle = this.kolor;
context.fillRect(x, y, this.szerokosc, this.wysokosc);
context.globalAlpha = 1.0;

    // ramka frakcji
    context.strokeStyle = this.kolor;
    context.lineWidth = 2;
    context.strokeRect(x, y, szer, wys);

    // poziom P
    //context.fillStyle = "white";
    //context.font = "10px Arial";
    //context.fillText(`${poziom}P`, x + szer / 2 - 5, y + wys / 2 + 3);

    // zasięg
    if (this.pokazanieDanych) {
        
        pokazPanel(this);
    }

    context.strokeStyle = "black";
    context.lineWidth = 1;
}
rysujZasieg() {
    const x = this.x + this.szerokosc / 2 + scrollX;
    const y = this.y + this.wysokosc / 2 + scrollY;

    // Wypełnienie (półprzezroczyste)
    context.save();
    context.globalAlpha = 0.2;
    context.beginPath();
    context.arc(x, y, this.zasieg, 0, 2 * Math.PI);
    context.fillStyle = this.kolor;
    context.fill();
    context.closePath();

    // Obramowanie (pełne krycie)
    context.globalAlpha = 1.0;
    context.strokeStyle = this.kolor;
    context.lineWidth = 1;
    context.stroke();

    context.restore();
}



}
function kolorDoFrakcji(kolor) {
    if (kolor === "green" || kolor === "darkGreen") return "mieszkalna";
    if (kolor === "red" || kolor === "pink") return "komercyjna";
    if (kolor === "blue" || kolor === "purple") return "naukowa";
    if (kolor === "yellow" || kolor === "orange") return "przemyslowa";
    return "neutralni";
}


class Oddzial {
    constructor(index, kolor, liczba) {
        this.index = index;
        this.kolor = kolor;
        this.liczba = liczba;
		this.zasiegOchrony = 0; // domyślnie, nadpisywane przy rekrutacji
		this.bazaX = budynki[index].x;
		this.bazaY = budynki[index].y;
        this.x = budynki[index].x;
        this.y = budynki[index].y;

        this.target = budynki[index]; // domyślnie stoi w miejscu
        this.hp = 100;
        this.captureProgress = 0;
        this.usun = false;
		 /*  if (this.target.kolor !== this.kolor) {
                this.captureProgress += 0.1;
                this.target.captureProgress = this.captureProgress;

                if (this.captureProgress >= 1) {
					this.target.kolor = this.kolor;
					this.target.captureProgress = 0;
					this.captureProgress = 0;

					// 🔥 Szukamy nowego celu
					let najblizszy = null;
					let minDystans = Infinity;

					for (let b of budynki) {
						if (b.kolor === this.kolor || b === this.target) continue;

						const dx = (this.x - b.x);
						const dy = (this.y - b.y);
						const dystans = dx * dx + dy * dy;

						if (dystans < minDystans) {
							minDystans = dystans;
							najblizszy = b;
						}
					}

					if (najblizszy) {
						this.ustawCel(najblizszy);
					} else {
						this.usun = true; // brak celów
					}

				}
            }*/
    }


    ustawCel(budynek) {
        this.target = budynek;
    }

    ruch() {
        if (this.x < this.target.x) this.x+=TILE/2;
        else if (this.x > this.target.x) this.x-=TILE/2;

        if (this.y < this.target.y) this.y+=TILE/2;
        else if (this.y > this.target.y) this.y-=TILE/2;
    }
znajdzWrogaNaMoimTerytorium(oddzialy) {
    const mojaFrakcja = kolorDoFrakcji(this.kolor);
    let cel = null;
    let minDystans = Infinity;


    for (let wróg of oddzialy) {
		//console.log(`🧠 Sprawdzam wroga ${wróg.id} z frakcji ${kolorDoFrakcji(wróg.kolor)} 
//vs. ${mojaFrakcja}, pozycja: ${wróg.x},${wróg.y}, baza: ${this.bazaX},${this.bazaY}, zasieg²: ${this.zasiegOchrony ** 2}`);
        if (
            kolorDoFrakcji(wróg.kolor) === mojaFrakcja ||
            wróg.usun 
        ) continue;

        const dxOchrona = this.bazaX - wróg.x;
        const dyOchrona = this.bazaY - wróg.y;
        const dystansOchronaKw = dxOchrona * dxOchrona + dyOchrona * dyOchrona;
		//console.log("🧠 sprawdzam dystansOchronaKw "+dystansOchronaKw)
        if (dystansOchronaKw > this.zasiegOchrony * this.zasiegOchrony) continue;

        const przypisanych = celePrzeciwnikowZajete.get(wróg.id) || 0;
		console.log("👀 przypisanych: ", przypisanych, "dla ID", wróg.id);
        if (przypisanych >= 2) continue;

        const dx = this.x - wróg.x;
        const dy = this.y - wróg.y;
        const dystansDoOddzialuKw = dx * dx + dy * dy;

        if (dystansDoOddzialuKw < minDystans) {
            minDystans = dystansDoOddzialuKw;
            cel = wróg;
        }
    }

    if (cel && cel.id !== undefined) {
        const obecni = celePrzeciwnikowZajete.get(cel.id) || 0;
        celePrzeciwnikowZajete.set(cel.id, obecni + 1);
    }

    return cel;
}





	szukajWrogaWZasieguOchrony() {
    let cel = null;
    let minDystans = Infinity;
    const mojaFrakcja = kolorDoFrakcji(this.kolor);

    //console.log(`🔍 Oddział ${this.kolor} szuka celu w zasięgu ${this.zasiegOchrony}`);

    for (let b of budynki) {
        const dxOchrona = this.bazaX - b.x;
        const dyOchrona = this.bazaY - b.y;
        const dystansDoOchronyKw = dxOchrona * dxOchrona + dyOchrona * dyOchrona;

        if (
            kolorDoFrakcji(b.kolor) === mojaFrakcja || 
            b.kolor === "black" || 
            dystansDoOchronyKw > this.zasiegOchrony * this.zasiegOchrony
        ) {
            continue;
        }

        // Odległość od oddziału (dla sortowania)
        const dx = this.x - b.x;
        const dy = this.y - b.y;
        const dystansDoOddzialuKw = dx * dx + dy * dy;

        // Log
        //console.log(
        //    ` - Kandydat budynek ${b.id} (${b.kolor}) dystans²: ${dystansDoOddzialuKw}`
       // );

        if (dystansDoOddzialuKw < minDystans) {
            minDystans = dystansDoOddzialuKw;
            cel = b;
        }
    }

    if (cel) {
        //console.log("🎯 Wybrano najbliższy w zasięgu: budynek", cel.id);
    } else {
       // console.log("❌ Brak wroga do podbicia w zasięgu");
    }

    return cel;
}




update(oddzialy) {
      const mojaFrakcja = kolorDoFrakcji(this.kolor);
    const walczy = oddzialy.some(o =>
        o !== this &&
        o.x === this.x &&
        o.y === this.y &&
        kolorDoFrakcji(o.kolor) !== mojaFrakcja
    );

    // 🔍 Szukaj intruza, jeśli aktualny cel nie jest aktywnym przeciwnikiem
    const intruz = this.znajdzWrogaNaMoimTerytorium(oddzialy);
    if (
        intruz &&
        (!this.target || this.target.typ !== "oddzial" ||
         kolorDoFrakcji(this.target.kolor) !== mojaFrakcja) &&
        !walczy
    ) {
        this.target = { x: intruz.x, y: intruz.y, kolor: intruz.kolor, typ: "oddzial", id: intruz.id };

        // ✅ Zaktualizuj liczbę przypisanych dopiero po nadaniu celu
       const obecni = celePrzeciwnikowZajete.get(intruz.id) || 0;
		if (obecni >= 2) return null; // lub continue
		celePrzeciwnikowZajete.set(intruz.id, obecni + 1);

    }


   if(!walczy) this.ruch();


    // Walka
    for (let inny of oddzialy) {
        if (
            inny !== this &&
            inny.x === this.x &&
            inny.y === this.y &&
            kolorDoFrakcji(inny.kolor) !== kolorDoFrakcji(this.kolor)
        ) {
            let dmgThis = 1;
            let dmgEnemy = 1;

            const mojaFrakcja = kolorDoFrakcji(this.kolor);
            const wrogaFrakcja = kolorDoFrakcji(inny.kolor);
            const wZasieguOchrony = (x, y, frakcja) => {
                const baza = (frakcja === mojaFrakcja) ? { x: this.bazaX, y: this.bazaY } : { x: inny.bazaX, y: inny.bazaY };
                const dx = baza.x - x;
                const dy = baza.y - y;
                return dx * dx + dy * dy <= (this.zasiegOchrony * this.zasiegOchrony);
            };

            if (wZasieguOchrony(this.x, this.y, mojaFrakcja)) {
                dmgEnemy *= 0.5;
                dmgThis *= 1.5;
            }

            if (wZasieguOchrony(inny.x, inny.y, wrogaFrakcja)) {
                dmgThis *= 0.5;
                dmgEnemy *= 1.5;
            }

            this.hp -= dmgEnemy;
            inny.hp -= dmgThis;
        }
    }

   if (this.hp <= 0) {
        this.usun = true;
        if (this.target?.id !== undefined) celeZajete.delete(this.target.id);
        if (this.target?.typ === "oddzial") {
			const obecni = celePrzeciwnikowZajete.get(this.target.id) || 0;
			if (obecni <= 1) {
				celePrzeciwnikowZajete.delete(this.target.id);
			} else {
				celePrzeciwnikowZajete.set(this.target.id, obecni - 1);
			}
		}

        return;
    }

    // 🎯 Dotarcie lub brak celu
    const dotarl = this.x === this.target?.x && this.y === this.target?.y;
    const celNieIstnieje =
        !this.target ||
        (this.target.typ === "oddzial" && !oddzialy.some(o => o.id === this.target.id && !o.usun));

  if ((!walczy && dotarl) || celNieIstnieje) {
    // 🧼 Jeśli dotarliśmy do wroga typu "oddzial", ale go już nie ma – czyścimy cele
    if (this.target?.typ === "oddzial") {
        const poprzedniObecni = celePrzeciwnikowZajete.get(this.target.id) || 0;
        if (poprzedniObecni <= 1) {
            celePrzeciwnikowZajete.delete(this.target.id);
        } else {
            celePrzeciwnikowZajete.set(this.target.id, poprzedniObecni - 1);
        }

        // Jeśli przeciwnik zniknął – zmień cel
        if (celNieIstnieje) {
            this.target = null;
            this.wybierzNowyCel();
            return;
        }
    }

    // 🏛️ Przechwytywanie budynku
    if (this.target && 'captureProgress' in this.target) {
        this.captureProgress += 0.1;
        this.target.captureProgress = this.captureProgress;

        if (this.captureProgress >= 1) {
            const budynek = budynki[this.target.id];
            if (budynek instanceof budynekOchrony) {
                console.log("🔥 Przejęto ochronę! Usuwanie oddziałów z budynku ID:", this.target.id);
                oddzialy = oddzialy.filter(o => o.id !== this.target.id);
            }
			if(this.target instanceof budynekMieszkalny){
				for (let inny of oddzialy) {
				if (
					inny !== this &&
					inny.kolor !== this.kolor &&
					inny.bazaX === this.target.x &&
					inny.bazaY === this.target.y
				) {
					inny.usun = true;
				}
			}

			}
			
            this.target.kolor = this.kolor;
            this.target.captureProgress = 0;
            this.captureProgress = 0;
			
            celeZajete.delete(this.target.id);
            this.wybierzNowyCel();
        }
    } else {
        this.wybierzNowyCel();
    }
} else {
    this.captureProgress = 0;
}

}

wybierzNowyCel() {
    const mojaFrakcja = kolorDoFrakcji(this.kolor);

    // 1. Priorytet: wróg w zasięgu ochrony
    const wZasiegu = this.szukajWrogaWZasieguOchrony();
    if (wZasiegu && !celeZajete.has(wZasiegu.id)) {
        this.ustawCel(wZasiegu);
        celeZajete.add(wZasiegu.id);
        return;
    }

    // 2. Inaczej: najbliższy dostępny budynek wroga/neutralny
    let najblizszy = null;
    let minDystans = Infinity;

    for (let b of budynki) {
        if (
            kolorDoFrakcji(b.kolor) === mojaFrakcja ||
            b === this.target ||
            celeZajete.has(b.id)
        ) continue;

        const dx = this.x - b.x;
        const dy = this.y - b.y;
        const dystans = dx * dx + dy * dy;

        if (dystans < minDystans) {
            minDystans = dystans;
            najblizszy = b;
        }
    }

    if (najblizszy) {
        this.ustawCel(najblizszy);
        celeZajete.add(najblizszy.id);
    } else {
        this.usun = true;
    }
}



rysuj() {
    const ctx = context;
    const budynekBaza = budynki[this.index];

    const px = this.x + budynekBaza.szerokosc / 2 + scrollX;
    const py = this.y + budynekBaza.wysokosc / 2 + scrollY;
    const promien = 12;

    // Wypełnione koło kolorem frakcji
    ctx.beginPath();
    ctx.arc(px, py, promien, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.kolor;
    ctx.fill();
    ctx.closePath();

    // Rysowanie drona na środku
    const wielkosc = 20;
    if (dron.complete) {
        ctx.drawImage(dron, px - wielkosc / 2, py - wielkosc / 2, wielkosc, wielkosc);
    } else {
        dron.onload = () => {
            ctx.drawImage(dron, px - wielkosc / 2, py - wielkosc / 2, wielkosc, wielkosc);
        };
    }

    // Pasek HP
    ctx.fillStyle = "black";
    ctx.fillRect(px - 15, py - 20, 30, 4);
    ctx.fillStyle = "lime";
    ctx.fillRect(px - 15, py - 20, (this.hp / 100) * 30, 4);
}

}



function zmienScroll(sx,sy){
    scrollX+=sx*5;
    scrollY+=sy*5;
}

function animacja() {
	const cel = 10_000_000_000;

const frakcje = [
  { klasa: "green", wartosc: globalnePieniadzeZielone },
  { klasa: "red", wartosc: globalnePieniadzeCzerwone },
  { klasa: "blue", wartosc: globalnePieniadzeNiebieskie },
  { klasa: "yellow", wartosc: globalnePieniadzeZolte }
];

for (let f of frakcje) {
  const procent = Math.min(100, (f.wartosc / cel) * 100);
  document.querySelector(`.ekopasek.${f.klasa}`).style.width = `${procent}%`;
}


    if (canvas === 0) canvas = document.getElementById("canvas");
    if (context === 0) context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);

    // Reset zysków
    globalnyProfitZielony = 0;
    globalnyProfitCzerwony = 0;
    globalnyProfitNiebieski = 0;
    globalnyProfitZolty = 0;

    // Mapa frakcji => zysk
    const mapaZyskow = {
        "mieszkalna": 0,
        "komercyjna": 0,
        "naukowa": 0,
        "przemyslowa": 0
    };

    for (let b of budynki) {
        b.rysuj();

        const frakcja = kolorDoFrakcji(b.kolor);
        const zysk = b.obliczZyskDlaFrakcji?.() || 0;

        if (frakcja in mapaZyskow) {
            mapaZyskow[frakcja] += zysk;
        }
    }
		for (let b of budynki) {
        if (b && b.pokazanieDanych && typeof b.rysujZasieg === "function") {
            b.rysujZasieg();
        }
    }
    // Przypisanie globalnych zysków
    globalnyProfitZielony = mapaZyskow["mieszkalna"];
    globalnyProfitCzerwony = mapaZyskow["komercyjna"];
    globalnyProfitNiebieski = mapaZyskow["naukowa"];
    globalnyProfitZolty = mapaZyskow["przemyslowa"];

    // Wyświetlenie przychodów
    document.getElementById("infoZieloni").innerText =
        `Green: $${Math.floor(globalnePieniadzeZielone)} (+${Math.floor(globalnyProfitZielony)})`;
    document.getElementById("infoCzerwoni").innerText =
        `Red: $${Math.floor(globalnePieniadzeCzerwone)} (+${Math.floor(globalnyProfitCzerwony)})`;
    document.getElementById("infoNiebiescy").innerText =
        `Blue: $${Math.floor(globalnePieniadzeNiebieskie)} (+${Math.floor(globalnyProfitNiebieski)})`;
    document.getElementById("infoZolci").innerText =
        `Yellow: $${Math.floor(globalnePieniadzeZolte)} (+${Math.floor(globalnyProfitZolty)})`;

    // Rysuj oddziały
    for (let oddzial of oddzialy) {
        oddzial.rysuj();
    }

   // requestAnimationFrame(animacja);
}

function wybierzFrakcje(frakcja) {
	 klikniecieDzwiek();
	uruchomMuzyke();
    frakcjaGracza = frakcja;
    document.getElementById("dolnyPanel").style.display = "none";
    console.log("Wybrano frakcję gracza:", frakcjaGracza);
}
function sprawdzWarunekZwyciestwa() {
    const sumaBudynkow = budynki.filter(b => b && b.kolor !== "black").length;

    const zieloni = indeksyZielone.length;
    const czerwoni = indeksyCzerwone.length;
    const niebiescy = indeksyNiebieskie.length;
    const zolci = indeksyZolte.length;

    const frakcje = [
        { nazwa: "green", liczba: zieloni, pieniadze: globalnePieniadzeZielone },
        { nazwa: "red", liczba: czerwoni, pieniadze: globalnePieniadzeCzerwone },
        { nazwa: "blue", liczba: indeksyNiebieskie.length, pieniadze: globalnePieniadzeNiebieskie },
        { nazwa: "yellow", liczba: indeksyZolte.length, pieniadze: globalnePieniadzeZolte }
    ];

    const progPieniedzy = 10_000_000_000;

    for (let f of frakcje) {
        if (f.liczba === sumaBudynkow) {
            alert(`🎉 VICTORY — faction ${f.nazwa} conquered the entire city!`);
            clearInterval(interwalUpgrade);
            return;
        }
        if (f.pieniadze >= progPieniedzy) {
            alert(`💰 ECONOMIC VICTORY — faction ${f.nazwa} reached ${progPieniedzy.toLocaleString()} $!`);
            clearInterval(interwalUpgrade);
            return;
        }
    }
}
function aiPrzeksztalcObronny(frakcja, kolorSpecjalny, pieniadzeFrakcji) {
    const ileOchron = policzBudynkiOchrony(frakcja);
    const koszt = 100000 * Math.pow(2, ileOchron);

    if (pieniadzeFrakcji > koszt * 2 && ileOchron < 5) {
        const kandydaci = budynki.filter(b =>
            kolorDoFrakcji(b.kolor) === frakcja && !(b instanceof budynekOchrony)
        );

        let najlepszy = null;
        let najwyzszeZagrozenie = -Infinity;

        for (let b of kandydaci) {
            let zagrozenie = 0;

            // 1. Wróg w pobliżu
            for (let o of oddzialy) {
                if (!o.usun && kolorDoFrakcji(o.kolor) !== frakcja) {
                    const dx = o.x - b.x;
                    const dy = o.y - b.y;
                    const dystans = Math.sqrt(dx * dx + dy * dy);

                    if (dystans < 150) {
                        zagrozenie += 200 - dystans;
                    }
                }
            }

            // 2. Wartość budynku
            if (typeof b.profit === "number") {
                zagrozenie += b.profit / 10;
            }

            // 3. Izolacja od innych ochron
            const inneOchrony = budynki.filter(o =>
                o instanceof budynekOchrony &&
                kolorDoFrakcji(o.kolor) === frakcja
            );

            let najblizsza = Infinity;
            for (let o of inneOchrony) {
                const dx = o.x - b.x;
                const dy = o.y - b.y;
                const dyst = Math.sqrt(dx * dx + dy * dy);
                if (dyst < najblizsza) najblizsza = dyst;
            }

            // Jeżeli nie ma innych ochron → daj bonus
            if (najblizsza === Infinity) {
                zagrozenie += 100;
            } else {
                zagrozenie += najblizsza / 10; // im dalej od ochrony, tym lepiej
            }

            if (zagrozenie > najwyzszeZagrozenie) {
                najwyzszeZagrozenie = zagrozenie;
                najlepszy = b;
            }
        }

        if (najlepszy) {
            przeksztalcWBudynekOchrony(najlepszy.id, kolorSpecjalny);
        }
    }
}




function aktualizujUpgrade() {
    // 1. Zbierz indeksy budynków
    indeksyZielone = [];
    indeksyCzerwone = [];
    indeksyNiebieskie = [];
    indeksyZolte = [];

    for (let i = 0; i < budynki.length; i++) {
        const b = budynki[i];
        if (!b) continue;

        const frakcja = kolorDoFrakcji(b.kolor);
        if (frakcja === "mieszkalna") indeksyZielone.push(i);
        else if (frakcja === "komercyjna") indeksyCzerwone.push(i);
        else if (frakcja === "naukowa") indeksyNiebieskie.push(i);
        else if (frakcja === "przemyslowa") indeksyZolte.push(i);
    }

    // 2. Zaktualizuj klientów i profity
    for (let b of budynki) {
        if (b?.sprawdzKlientow) b.sprawdzKlientow();
        if (b?.aktualizujProfit) b.aktualizujProfit();
    }

    // 3. Dodaj pieniądze z przychodów
    globalnePieniadzeZielone += globalnyProfitZielony;
    globalnePieniadzeCzerwone += globalnyProfitCzerwony;
    globalnePieniadzeNiebieskie += globalnyProfitNiebieski;
    globalnePieniadzeZolte += globalnyProfitZolty;


    // 4. Automatyczna rekrutacja oddziałów (AI tylko)
    for (let b of budynki) {
    if (!(b instanceof budynekOchrony)) continue;
	
    const frakcja = kolorDoFrakcji(b.kolor);
    if (frakcja === frakcjaGracza) continue; // pomiń gracza

    const aktywne = oddzialy.filter(o =>
        o.bazaX === b.x && o.bazaY === b.y && !o.usun
    ).length;

    if (aktywne < 10+b.poziom) {
        const mapaKolorow = {
            "darkGreen": "green",
            "green": "green",
            "pink": "red",
            "red": "red",
            "purple": "blue",
            "blue": "blue",
            "orange": "yellow",
            "yellow": "yellow"
        };
        const kolorFrakcyjny = mapaKolorow[b.kolor] || "black";

        let nowy = new Oddzial(b.id, kolorFrakcyjny, 1);
        nowy.zasiegOchrony = b.zasieg;
		nowy.typ="oddzial";
        nowy.bazaX = b.x;
        nowy.bazaY = b.y;
        nowy.index = b.id;
		nowy.id=Date.now() + Math.random();
        oddzialy.push(nowy);
    }
}


    // 5. Znajdź aktualny najniższy poziom budynków dla każdej frakcji
    if (indeksyZielone.length > 0) aktualnyNajnizszyPoziomZielony = indeksyZielone[0];
    if (indeksyCzerwone.length > 0) aktualnyNajnizszyPoziomCzerwony = indeksyCzerwone[0];
    if (indeksyNiebieskie.length > 0) aktualnyNajnizszyPoziomNiebieski = indeksyNiebieskie[0];
    if (indeksyZolte.length > 0) aktualnyNajnizszyPoziomZolty = indeksyZolte[0];

    // 6. Automatyczne ulepszanie (AI tylko)
    if (frakcjaGracza !== "mieszkalna") {
        for (let i of indeksyZielone) {
            if (budynki[i].poziom <= budynki[aktualnyNajnizszyPoziomZielony].poziom)
                aktualnyNajnizszyPoziomZielony = i;

            budynki[i].upgrade();
            budynki[i].aktualizujProfit();
        }
    }

    if (frakcjaGracza !== "komercyjna") {
        for (let i of indeksyCzerwone) {
            if (budynki[i].poziom <= budynki[aktualnyNajnizszyPoziomCzerwony].poziom)
                aktualnyNajnizszyPoziomCzerwony = i;

            budynki[i].upgrade();
            budynki[i].aktualizujProfit();
        }
    }

    if (frakcjaGracza !== "naukowa") {
        for (let i of indeksyNiebieskie) {
            if (budynki[i].poziom <= budynki[aktualnyNajnizszyPoziomNiebieski].poziom)
                aktualnyNajnizszyPoziomNiebieski = i;

            budynki[i].upgrade();
            budynki[i].aktualizujProfit();
        }
    }

    if (frakcjaGracza !== "przemyslowa") {
        for (let i of indeksyZolte) {
            if (budynki[i].poziom <= budynki[aktualnyNajnizszyPoziomZolty].poziom)
                aktualnyNajnizszyPoziomZolty = i;

            budynki[i].upgrade();
            budynki[i].aktualizujProfit();
        }
    }
if (!graZakonczona) {
    aiPrzeksztalcObronny("green", "darkGreen", globalnePieniadzeZielone);
    aiPrzeksztalcObronny("red", "pink", globalnePieniadzeCzerwone);
    aiPrzeksztalcObronny("blue", "purple", globalnePieniadzeNiebieskie);
    aiPrzeksztalcObronny("yellow", "orange", globalnePieniadzeZolte);
}

    sprawdzWarunekZwyciestwa();
}


function wczytaj(){
	canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
przeliczRozmiarTila();
    // --- Konfiguracja mapy ---
const krokOchrony = 12;
const liczbaOchronnychX = 2;
const liczbaOchronnychY = 2;

var szerokoscMiasta = krokOchrony * liczbaOchronnychX;
var wysokoscMiasta = krokOchrony * liczbaOchronnychY;

 budynki = new Array(szerokoscMiasta * wysokoscMiasta);

// --- Generowanie losowych budynków ---
for (let j = 0; j < wysokoscMiasta; j++) {
    for (let i = 0; i < szerokoscMiasta; i++) {
        const index = j * szerokoscMiasta + i;
        const los = Math.random();

        if (los < 0.33) {
            budynki[index] = new budynekMieszkalny(index, "mieszkanie1.png", i * TILE, j * TILE, 50, 10);
        } else if (los < 0.66) {
            budynki[index] = new budynekKomercyjny(index, "mieszkanie1.png", i * TILE, j * TILE, 2*TILE, 10);
        } else {
            budynki[index] = new budynekPrzemyslowy(index, "mieszkanie1.png", i * TILE, j * TILE, 2*TILE, -5);
        }
    }
}

// --- Dodanie 4 budynków ochrony w siatce 2x2 ---
const koloryFrakcji = ["darkGreen", "pink", "purple", "orange"];
const margines = 4;

let frakcjaIndex = 0;
for (let y = 0; y < liczbaOchronnychY; y++) {
    for (let x = 0; x < liczbaOchronnychX; x++) {
        const gridX = Math.floor(x * (szerokoscMiasta - 2 * margines) / (liczbaOchronnychX - 1) + margines);
        const gridY = Math.floor(y * (wysokoscMiasta - 2 * margines) / (liczbaOchronnychY - 1) + margines);
        const index = gridY * szerokoscMiasta + gridX;

        const kolor = koloryFrakcji[frakcjaIndex % koloryFrakcji.length];
        frakcjaIndex++;

        budynki[index] = new budynekOchrony(index, "mieszkanie1.png", gridX * TILE, gridY * TILE, 4*TILE, -2, kolor);
    }
}
indeksyZielone = [];
indeksyCzerwone = [];
indeksyNiebieskie = [];
indeksyZolte = [];

for (let i = 0; i < budynki.length; i++) {
    const b = budynki[i];
    if (!b) continue;

    const frakcja = kolorDoFrakcji(b.kolor);

    if (frakcja === "mieszkalna") indeksyZielone.push(i);
    else if (frakcja === "komercyjna") indeksyCzerwone.push(i);
    else if (frakcja === "naukowa") indeksyNiebieskie.push(i);
    else if (frakcja === "przemyslowa") indeksyZolte.push(i);
}

// --- Aktualizacja profitu po utworzeniu wszystkich budynków ---
for (let b of budynki) {
	 if (b && typeof b.sprawdzKlientow === "function") {
		
        b.sprawdzKlientow();
		
    }
    if (b && typeof b.aktualizujProfit === "function") {
		
        b.aktualizujProfit();
		
    }
	 
}
 interwalUpgrade = setInterval(aktualizujUpgrade, 10000);
 interwalAnimacji = setInterval(() => {
    for (let oddzial of oddzialy) oddzial.update(oddzialy);
    oddzialy = oddzialy.filter(o => !o.usun);
    animacja();
}, 500);
	
   canvas.addEventListener('mousemove', function(event) {// event listenery do myszki

	const rect = canvas.getBoundingClientRect();
mx = event.clientX - rect.left;
my = event.clientY - rect.top;
 

}, false);
canvas.addEventListener('mouseup', function(event) {// event listenery do myszki
  const rect = canvas.getBoundingClientRect();
    mx = event.clientX - rect.left;
    my = event.clientY - rect.top;
	const poprawka = TILE / 2;
my -= poprawka;
  //)  for(var i=0,len=budynki.length;i<len;i++){
   //     if(budynki[i].pokazanieDanych)budynki[i].pokazUkryjDane();
   // }
   // console.log("mx my "+mx+" "+my);
   
     for(var i=0,len=budynki.length;i<len;i++){
         if(budynki[i].pokazanieDanych)budynki[i].pokazUkryjDane();
     }

for(var i=0,len=budynki.length;i<len;i++){

    if (
    mx > budynki[i].x + scrollX &&
    mx < budynki[i].x + budynki[i].szerokosc + scrollX &&
    my > budynki[i].y + scrollY &&
    my < budynki[i].y + budynki[i].wysokosc + scrollY
) {
    klikniecieDzwiek();
    budynki[i].pokazUkryjDane();
    console.log("klik:", i, "mx", mx, "my", my);
}


     

}
		
	
 // const klikX = event.offsetX + scrollX;
  //  const klikY = event.offsetY + scrollY;

   // for (let b of budynki) {
  //  if (
   //     klikX >= b.x  && klikX <= b.x + b.szerokosc &&
   //     klikY >= b.y  && klikY <= b.y + b.wysokosc 
  //  ) {
  //      pokazPanel(b);
  //      return;
  //  }
//}


    document.getElementById("panelBudynku").style.display = "none";
}, false); 
    
     
let isDragging = false;
let lastX = 0;
let lastY = 0;

let maxScrollX = 0;
let maxScrollY = 0;
// LIMITY SCROLLA
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function aktualizujLimityScrolla() {
    // Przykład na podstawie wielkości kafelków 25px
    maxScrollX = -(szerokoscMiasta * TILE - canvas.width);
    maxScrollY = -(wysokoscMiasta * TILE - canvas.height);
}
aktualizujLimityScrolla(); // wywołaj na starcie (można też po zmianie rozmiaru canvas)


// MYSZ
canvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener("mousemove", (e) => {
    if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        scrollX = clamp(scrollX + dx, maxScrollX, 0);
        scrollY = clamp(scrollY + dy, maxScrollY, 0);
        lastX = e.clientX;
        lastY = e.clientY;
    }
});

canvas.addEventListener("mouseup", () => {
    isDragging = false;
});
canvas.addEventListener("mouseleave", () => {
    isDragging = false;
});

// DOTYK
canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
        isDragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
    }
});

canvas.addEventListener("touchmove", (e) => {
    if (isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        const dx = touch.clientX - lastX;
        const dy = touch.clientY - lastY;
        scrollX = clamp(scrollX + dx, maxScrollX, 0);
        scrollY = clamp(scrollY + dy, maxScrollY, 0);
        lastX = touch.clientX;
        lastY = touch.clientY;
    }
    e.preventDefault(); // zapobiega scrollowaniu strony
}, { passive: false });

canvas.addEventListener("touchend", () => {
    isDragging = false;
});
window.addEventListener("resize", () => {
    przeliczRozmiarTila();
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    aktualizujLimityScrolla();
});

    
}

function pokazPanel(budynek) {
    wybranyBudynek = budynek;

    document.getElementById("panelBudynku").style.display = "block";
    document.getElementById("nazwaBudynku").innerText = `Building ${budynek.id}`;

    const frakcja = kolorDoFrakcji(budynek.kolor);
    const poziom = budynek.poziom ;
    let kosztUlepszenia = "?";
    let kosztRekrutacji = null;

    // Oblicz koszt ulepszenia na podstawie typu
    if (budynek instanceof budynekMieszkalny || budynek instanceof budynekKomercyjny) {
        kosztUlepszenia = 3000 + 1000 * poziom;
    } else if (budynek instanceof budynekPrzemyslowy) {
        kosztUlepszenia = 6500 + 1200 * poziom;
    } else if (budynek instanceof budynekOchrony) {
        kosztUlepszenia = 7000 + 2000 * poziom;
        kosztRekrutacji = 0; // lub np. 0 jeśli rekrutacja darmowa
    }

    // Wyświetlanie typów i przycisków
    if (budynek instanceof budynekMieszkalny) {
        document.getElementById("typBudynku").innerText = "residential";
        document.getElementById("zyskBudynku").innerText = Math.floor(budynek.obliczZyskDlaFrakcji());
        document.getElementById("btnRekrutuj").style.display = "none";
    } else if (budynek instanceof budynekPrzemyslowy) {
        document.getElementById("typBudynku").innerText = "industrial";
        document.getElementById("zyskBudynku").innerText = Math.floor(budynek.obliczZyskDlaFrakcji());
        document.getElementById("btnRekrutuj").style.display = "none";
    } else if (budynek instanceof budynekOchrony) {
		document.getElementById("typBudynku").innerText = "security";
		document.getElementById("zyskBudynku").innerText = Math.floor(budynek.obliczZyskDlaFrakcji());
	
		document.getElementById("btnRekrutuj").style.display = (frakcja === frakcjaGracza) ? "block" : "none";

		// Koszt rekrutacji oparty na liczbie istniejących oddziałów z tego budynku
		const aktywne = oddzialy.filter(o =>
			o.bazaX === budynek.x && o.bazaY === budynek.y && !o.usun
		).length;

		const bazowyKoszt = 1000;
		kosztRekrutacji = Math.floor(bazowyKoszt * Math.pow(1.5, aktywne));
    } else if (budynek instanceof budynekKomercyjny) {
        document.getElementById("typBudynku").innerText = "commercial";
        document.getElementById("zyskBudynku").innerText = Math.floor(budynek.obliczZyskDlaFrakcji());
        document.getElementById("btnRekrutuj").style.display = "none";
    } else {
        document.getElementById("typBudynku").innerText = "unknown";
        document.getElementById("zyskBudynku").innerText = "?";
        document.getElementById("btnRekrutuj").style.display = "none";
    }

    // Pokaż/ukryj przycisk ulepszenia
    document.getElementById("btnUlepsz").style.display = (frakcja === frakcjaGracza) ? "block" : "none";

    // Koszty
    document.getElementById("kosztUlepszenia").innerText =
        (frakcja === frakcjaGracza) ? `Upgrade cost: $${kosztUlepszenia}` : "";
		var tekst="";
let infoRekrutacja = "";
if (frakcja === frakcjaGracza && kosztRekrutacji !== null) {
    infoRekrutacja += `Recruitment cost: $${kosztRekrutacji}`;
}
if (budynek instanceof budynekOchrony) {
    const aktywne = oddzialy.filter(o =>
        o.bazaX === budynek.x && !o.usun && o.bazaY === budynek.y
    ).length;
    const max = 10 + budynek.poziom ;
    infoRekrutacja += ` | Units: ${aktywne}/${max}`;
}
document.getElementById("kosztRekrutacji").innerText = infoRekrutacja;

    // Poziom
    document.getElementById("poziomBudynku").innerText = poziom;
	// Pokaż/ukryj przycisk przekształcenia
const pokazPrzyciskPrzeksztalc =
    !(budynek instanceof budynekOchrony) &&
    kolorDoFrakcji(budynek.kolor) === frakcjaGracza;

document.getElementById("btnPrzeksztalc").style.display = pokazPrzyciskPrzeksztalc ? "block" : "none";

// Pokaz koszt przeksztalcenia
if (pokazPrzyciskPrzeksztalc) {
    const frakcja = kolorDoFrakcji(budynek.kolor);
    const ileOchron = policzBudynkiOchrony(frakcja);
    const koszt = 100000 * Math.pow(2, ileOchron);
    document.getElementById("kosztPrzeksztalcenia").innerText =
        `Security conversion cost: $${koszt.toLocaleString()}`;
} else {
    document.getElementById("kosztPrzeksztalcenia").innerText = "";
}

}


function ulepszBudynek() {
   // if (wybranyIndeks === null) return;

    const b = budynki[wybranyBudynek.id];
    b.upgrade();
	 if(b instanceof budynekKomercyjny)b.sprawdzKlientow();
    //b.aktualizuj();
	//  b.aktualizujProfit();
	 
    pokazPanel(b);
}

function rekrutujOddzial() {
    if (!wybranyBudynek || !(wybranyBudynek instanceof budynekOchrony)) return;

   const aktywne = oddzialy.filter(o =>
    o.index === wybranyBudynek.id && !o.usun
).length;

    if (aktywne >= 10+wybranyBudynek.poziom) {
        alert("This building reached its unit limit (10).");
        return;
    }

    // Koszt dynamiczny (ten sam jak w pokazPanel)
    const bazowyKoszt = 1000;
    const koszt = Math.floor(bazowyKoszt * Math.pow(1.5, aktywne));
    const kolor = wybranyBudynek.kolor;
    const kolorFrakcyjny = {
        "darkGreen": "green",
            "green": "green",
            "pink": "red",
            "red": "red",
            "purple": "blue",
            "blue": "blue",
            "orange": "yellow",
            "yellow": "yellow"
    }[kolor] || "black";

    // Pieniądze gracza
    const frakcja = kolorDoFrakcji(kolor);
    let kasa = 0;

    switch (frakcja) {
        case "mieszkalna": kasa = globalnePieniadzeZielone; break;
        case "komercyjna": kasa = globalnePieniadzeCzerwone; break;
        case "naukowa": kasa = globalnePieniadzeNiebieskie; break;
        case "przemyslowa": kasa = globalnePieniadzeZolte; break;
    }

    if (kasa < koszt) {
        alert("You don't have enough money!");
        return;
    }

    // Odjęcie kasy
    switch (frakcja) {
        case "residential": globalnePieniadzeZielone -= koszt; break;
        case "commercial": globalnePieniadzeCzerwone -= koszt; break;
        case "science": globalnePieniadzeNiebieskie -= koszt; break;
        case "industrial": globalnePieniadzeZolte -= koszt; break;
    }

    const nowy = new Oddzial(wybranyBudynek.id, kolorFrakcyjny, 1);
    nowy.zasiegOchrony = wybranyBudynek.zasieg;
	nowy.typ="oddzial";
	nowy.index=wybranyBudynek.id;
    nowy.bazaX = wybranyBudynek.x;
    nowy.bazaY = wybranyBudynek.y;
	nowy.id=Date.now() + Math.random();
    oddzialy.push(nowy);
}

