const imgBase =
  "http://68.183.151.133/images/https___static.trulia-cdn.com_pictures_thumbs_6_zillowstatic";

let allImages = [];

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

function chunkArray(array, size) {
  const chunkedArr = [];
  for (let i = 0; i < array.length; i++) {
    const last = chunkedArr[chunkedArr.length - 1];
    if (!last || last.length === size) {
      chunkedArr.push([array[i]]);
    } else {
      last.push(array[i]);
    }
  }
  return chunkedArr;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Vue.component("slideshow", {
  template: `
    <div class="image-app" @mouseover="pause">
      <div
        class="images-holder"
        :style="{backgroundImage: 'url(' + image + ')'}"
      >
        <button class="image-nav" @click="prev"><span><</span></button>
        <button class="image-nav" @click="next"><span>></span></button>
      </div>

      <div class="image-cats-holder" v-cloak>
        <span class="image-cat">{{cat}}</span>
        <span class="image-counts">{{index + 1}} of {{images.length}}</span>
      </div>
    </div>`,
  props: {
    images: {
      type: Array,
      required: true,
    },
    cat: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      index: 0,
      timer: Math.floor(Math.random() * 1000) + 500,
      playing: false,
    };
  },
  created() {
    if (this.playing) {
      this.timeout = setTimeout(this.next, this.timer);
    }
    this.preload(this.index + 1);
  },
  methods: {
    next() {
      this.index++;
      if (this.index >= this.images.length) {
        this.index = 0;
      }
      this.preload(this.index + 1);
      if (this.playing) {
        this.timeout = setTimeout(this.next, this.timer);
      }
    },
    prev() {
      this.index--;
      if (this.index < 0) {
        this.index = this.images.length - 1;
      }
      this.preload(this.index - 1);
    },
    preload(i) {
      if (this.images[i]) {
        let nextImage = new Image();
        nextImage.src = imgBase + this.images[i];
      }
    },
    pause() {
      this.playing = false;
      clearTimeout(this.timeout);
    },
  },
  computed: {
    image() {
      return imgBase + this.images[this.index];
    },
  },
});

const ImageApp = new Vue({
  el: "#image-app",
  data: {
    cats: [],
    cat: null,
    index: 0,
    images: [],
    image: null,
    loading: true,
  },

  async created() {
    response = await fetch("data/images.json");
    allImages = await response.json();
    this.cats = Object.keys(allImages);
    for (let c of this.cats) {
      shuffleArray(allImages[c]);
    }
    this.images = allImages;
    // this.cat = this.cats[0];
    // this.images = allImages[this.cats[0]];
    // this.setImage(0);
    // this.loading = false;
    // this.autoplay = true;
    // this.startTimer();
  },

  methods: {
    update() {
      this.index = 0;
      this.images = allImages[this.cat];
      this.setImage(0);
    },
    next() {
      let i = this.index;
      i++;
      if (i >= this.images.length) {
        i = 0;
      }
      this.index = i;
      this.setImage(i);
    },
    prev() {
      let i = this.index;
      i--;
      if (i < 0) {
        i = this.images.length - 1;
      }
      this.index = i;
      this.setImage(i);
    },
    setImage(i) {
      if (this.images[i]) {
        this.image = imgBase + this.images[i];
      }
      if (this.images[i + 1]) {
        let nextImage = new Image();
        nextImage.src = imgBase + this.images[i + 1];
      }
    },
    startTimer() {
      this.interval = setInterval(this.next, 1000);
    },
    stopTimer() {
      clearInterval(this.interval);
    },
  },
});

const ContactApp = new Vue({
  el: "#contact-app",
  data: { agents: [], index: 0, batchSize: 100 },
  async created() {
    response = await fetch("data/agents.json");
    this.agents = await response.json();
  },
  methods: {
    contact() {
      const totalPerMessage = this.batchSize;
      const chunks = chunkArray(this.agents, totalPerMessage);
      const urls = chunks.map(c => {
        const numbers = c.map(a => a[1]).join(",");
        return (url = `sms:/open?addresses=${numbers}&body=I'm interested in the New York Apartment`);
      });

      location.href = urls[this.index];
      this.index ++;

      if (this.index >= urls.length) {
        this.reset();
      }
    },
    reset() {
      this.index = 0;
    },
    async contactBatches() {
      if (confirm("Are you sure?")) {
        const totalPerMessage = this.batchSize;
        const chunks = chunkArray(this.agents, totalPerMessage);
        const urls = chunks.map(c => {
          const numbers = c.map(a => a[1]).join(",");
          return (url = `sms:/open?addresses=${numbers}&body=I'm interested in the New York Apartment`);
        });
        for (let url of urls) {
          location.href = url;
          await sleep(100);
        }
      }
    },
  },
});

Vue.component("animated-integer", {
  template: "<span>{{ formattedValue }}</span>",
  props: {
    value: {
      type: Number,
      required: true,
    },
  },
  data: function() {
    return {
      tweeningValue: 0,
    };
  },
  watch: {
    value: function(newValue, oldValue) {
      this.tween(oldValue, newValue);
    },
  },
  mounted: function() {
    this.tween(0, this.value);
  },
  computed: {
    formattedValue() {
      return this.tweeningValue
        .toString()
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    },
  },
  methods: {
    tween: function(startValue, endValue) {
      var vm = this;

      function animate() {
        if (TWEEN.update()) {
          requestAnimationFrame(animate);
        }
      }
      new TWEEN.Tween({
        tweeningValue: startValue,
      })
        .to(
          {
            tweeningValue: endValue,
          },
          1000
        )
        .onUpdate(function() {
          vm.tweeningValue = this.tweeningValue.toFixed(0);
        })
        .start();
      animate();
    },
  },
});

const CalculatorApp = new Vue({
  el: "#calculator-app",
  data: {
    price: 47558777359,
    mortgage: 0,
    monthly: 0,
    down: 20,
    interestPrinciple: 0,
    tax: 0,
    hoa: 0,
    n: 12,
    y: 30,
    r: 0.04 * 100,
    salary: 56516,
    repayments: 0,
    payment: 0,
    dep: 0,
    end: 0,
    carbon: null,
    insects: 100,
    totalInterest: 0,
  },

  methods: {
    calculate() {
      this.resetData();
      this.dep = this.price * (this.down / 100);
      this.mortgage = this.price - this.dep;
      this.payment = ((this.salary * 0.67) / 12) * 0.3;
      //(-log(1- i * A / P)) / log (1 + i)
      //this.repayments = -1 * (Math.log(1 - this.r * this.mortgage / this.payment)/Math.log(1 + this.r))
      const monthlyRate = Number(this.r) / 12;
      const totalPayments = Number(this.n) * Number(this.y);

      console.log(monthlyRate, totalPayments, this.y);

      this.interestPrinciple =
        this.mortgage *
        ((monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
          (Math.pow(1 + monthlyRate, totalPayments) - 1));

      this.tax = this.price * 0.0014;
      this.hoa = 32287410;

      this.monthly = this.sum(this.tax, this.hoa, this.interestPrinciple);
      this.totalInterest = this.monthly * totalPayments - this.mortgage;
      this.end = new Date().getFullYear() + Number(this.y);
      this.carbon = 408.53 + this.y * 2.5;
      this.insects = 100 * (1 - Math.pow(0.975, this.y));
    },

    resetData() {
      this.monthly = null;
      this.dep = null;
      this.tax = null;
      this.hoa = null;
    },

    sum(tax, hoa, interest) {
      let total = tax + hoa + interest;
      return total;
    },

    formatNumber(num) {
      num = num.toFixed(0);
      return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    },
    trackChange() {
      this.price = parseInt(this.price) === 0  ? null : this.price
    }
  },
});

const modal = document.querySelector("#modal");
const closeModal = document.querySelector("#close-modal");
const openModalButtons = document.querySelectorAll(".open-tour");
const frame = document.querySelector("iframe");

function addTourListener(b) {
  b.addEventListener("click", function(e) {
    e.preventDefault();
    frame.src = "tour/?scene=" + b.dataset.scene;
    modal.style.display = "flex";
  });
}

for (let b of openModalButtons) {
  addTourListener(b);
}

closeModal.addEventListener("click", function(e) {
  e.preventDefault();
  frame.src = "";
  modal.style.display = "none";
});
