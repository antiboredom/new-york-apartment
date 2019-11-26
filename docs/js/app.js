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
    this.cat = this.cats[0];
    this.images = allImages[this.cats[0]];
    this.setImage(0);
    this.loading = false;
    this.autoplay = true;
    this.startTimer();
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
  data: { agents: [] },
  async created() {
    response = await fetch("data/agents.json");
    this.agents = await response.json();
  },
  methods: {
    async contactBatches() {
      if (confirm("Are you sure?")) {
        const totalPerMessage = 500;
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
          500
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
    mortage: 0,
    monthly: 0,
    down: 0,
    interestPrinciple: 0,
    tax: 0,
    hoa: 0,
    n: 12 * 30,
    y: 30,
    r: 4 / 12 / 100,
  },

  methods: {
    calculate() {
      this.resetData();

      this.down = this.price / 5;
      this.mortgage = this.price - this.down;
      this.interestPrinciple = Number(
        (this.mortgage * (this.r * Math.pow(1 + this.r, this.n * this.y))) /
          Math.pow(1 + this.r, this.n * this.y)
      );
      this.tax = this.price * 0.0014;
      this.hoa = 32287410;
      this.monthly = this.sum(this.tax, this.hoa, this.interestPrinciple);
    },

    resetData() {
      this.monthly = null;
      this.down = null;
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
  },
});

const modal = document.querySelector("#modal");
const closeModal = document.querySelector("#close-modal");
const openModalButton = document.querySelector("#open-tour");
const frame = document.querySelector("iframe");

openModalButton.addEventListener("click", function(e) {
  e.preventDefault();
  frame.src = "/tour/";
  modal.style.display = "flex";
});

closeModal.addEventListener("click", function(e) {
  e.preventDefault();
  frame.src = "";
  modal.style.display = "none";
});
