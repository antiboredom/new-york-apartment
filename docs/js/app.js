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
    let response = await fetch("data/images.json");
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
    let response = await fetch("data/agents.json");
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
      this.index++;

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
    formatting: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  data: function() {
    return {
      tweeningValue: 0,
    };
  },
  created() {
    this.time = Math.floor(Math.random() * 600) + 1000;
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
      if (!this.formatting) return this.tweeningValue;

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
          vm.time
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
    percentOfSalary: 0,
  },

  methods: {
    calculate() {
      this.resetData();

      this.$nextTick(() => {
        this.dep = this.price * (this.down / 100);
        this.mortgage = this.price - this.dep;
        this.payment = ((this.salary * 0.67) / 12) * 0.3;

        const totalPayments = Number(this.n) * Number(this.y);
        const rate = Number(this.r) / 100 / 12;

        this.interestPrinciple =
          (rate * this.mortgage * Math.pow(1 + rate, totalPayments)) /
          (Math.pow(1 + rate, totalPayments) - 1);

        if (rate == 0) {
          this.interestPrinciple = this.mortgage / totalPayments;
        }

        this.tax = this.price * 0.0014;
        this.hoa = 32287410;

        this.monthly = this.sum(this.tax, this.hoa, this.interestPrinciple);
        this.totalInterest = this.monthly * totalPayments - this.mortgage;
        this.end = new Date().getFullYear() + Number(this.y);
        this.carbon = 408.53 + this.y * 2.5;
        this.insects = 100 * (1 - Math.pow(0.975, this.y));
        this.percentOfSalary = (this.monthly / (this.salary / 12)) * 100;
      });
    },

    resetData() {
      this.monthly = 0;
      this.dep = 0;
      this.tax = 0;
      this.hoa = 0;
      this.percentOfSalary = 0;
      this.interestPrinciple = 0;
      this.totalInterest = 0;
      this.mortgage = 0;
      this.end = 0;
      this.carbon = 0;
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
      this.price = parseInt(this.price) === 0 ? null : this.price;
    },
  },
});

async function setupQuestions() {
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    return false;
  }

  function make() {
    let startX = window.innerWidth + 200;
    let endX = -window.innerWidth;
    let startY = Math.random() * window.innerHeight - 50;
    let endY = startY;
    let r = 0;
    let h = Math.random() * 255;
    let s = 100;
    let b = 50;
    let speed = Math.random() * 20 + 20;

    let styles = [
      // `box-shadow: 0px 0px 5px hsl(${h}, ${s}%, ${b}%)`,
      `transform: rotate(${r}deg) translate(${startX}px, ${startY}px)`,
      `transition-duration: ${speed}s`,
    ].join(";");

    let content = `<span class="question" style="${styles}">${questions[index]}</span>`;

    let el = document.createElement("div");
    el.innerHTML = content;
    el = el.firstChild;
    document.body.append(el);

    let deleted = false;
    el.addEventListener("transitionend", () => {
      if (!deleted) {
        deleted = true;
        document.body.removeChild(el);
      }
    });

    setTimeout(() => {
      el.style.transform = `rotate(${r}deg) translate(${endX}px, ${endY}px)`;
    }, 100);

    index++;
    if (index >= questions.length) {
      index = 0;
    }
  }

  function startEm() {
    questionInterval = setInterval(make, 4000);
  }

  let response = await fetch("data/selected_questions.txt");
  let questions = await response.text();
  questions = questions.split("\n");

  let index = 0;
  const timeToStart = 5000;

  let countdownTimeout = setTimeout(startEm, timeToStart);
  let questionInterval;

  window.addEventListener("mousemove", e => {
    for (let el of document.querySelectorAll(".question")) {
      document.body.removeChild(el);
    }

    clearTimeout(countdownTimeout);
    clearInterval(questionInterval);
    countdownTimeout = setTimeout(startEm, timeToStart);
  });
}

setupQuestions();

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
