const BONES = [
  ["root", "position anchor"],
  ["hip", "pelvis and lower body"],
  ["spine", "body lean"],
  ["chest", "armor and shoulders"],
  ["neck", "head connector"],
  ["head", "face direction"],
  ["frontUpperArm", "weapon side arm"],
  ["frontForearm", "weapon follow-through"],
  ["frontHand", "weapon slot"],
  ["backUpperArm", "offhand side arm"],
  ["backForearm", "shield or gesture"],
  ["frontLeg", "walk stride"],
  ["backLeg", "counter stride"],
];

const SLOTS = [
  ["head", "face, hair, helmet"],
  ["chest", "shirt, armor, chest mark"],
  ["shoulderFront", "front shoulder armor"],
  ["shoulderBack", "back shoulder armor"],
  ["handFront", "weapon"],
  ["handBack", "shield or prop"],
  ["cape", "cape or wings"],
  ["fx", "attack and spell effects"],
];

const CLASSES = {
  tank: {
    label: "坦克",
    note: "宽肩、盾牌、低重心。",
    armor: "#7b8a94",
    armorDark: "#424d57",
    cloth: "#4a4d56",
    cape: "#394053",
    weapon: "shieldSword",
    mini: {
      color: "#7b8a94",
      bodyWidth: "30px",
      weaponLeft: "1px",
      weaponTop: "28px",
      weaponWidth: "18px",
      weaponHeight: "27px",
      weaponRotate: "0deg",
    },
  },
  warrior: {
    label: "战士",
    note: "斜向大剑、胸甲清楚。",
    armor: "#a96f42",
    armorDark: "#694027",
    cloth: "#5c3f2f",
    cape: "#583834",
    weapon: "greatsword",
    mini: {
      color: "#a96f42",
      bodyWidth: "25px",
      weaponLeft: "37px",
      weaponTop: "12px",
      weaponWidth: "5px",
      weaponHeight: "51px",
      weaponRotate: "-24deg",
    },
  },
  assassin: {
    label: "刺客",
    note: "前倾、双匕首、小体型。",
    armor: "#6655a0",
    armorDark: "#382e61",
    cloth: "#31294d",
    cape: "#221f37",
    weapon: "dagger",
    mini: {
      color: "#6655a0",
      bodyWidth: "22px",
      weaponLeft: "39px",
      weaponTop: "35px",
      weaponWidth: "20px",
      weaponHeight: "4px",
      weaponRotate: "-10deg",
    },
  },
  mage: {
    label: "法师",
    note: "法杖、披风、后排姿态。",
    armor: "#426fb1",
    armorDark: "#253d70",
    cloth: "#303b73",
    cape: "#26325f",
    weapon: "staff",
    mini: {
      color: "#426fb1",
      bodyWidth: "24px",
      weaponLeft: "43px",
      weaponTop: "7px",
      weaponWidth: "5px",
      weaponHeight: "60px",
      weaponRotate: "-9deg",
    },
  },
};

const ARMORS = {
  leather: {
    label: "皮甲",
    armor: "#8a6042",
    armorDark: "#4a3527",
    cloth: "#46382d",
  },
  iron: {
    label: "铁甲",
    armor: "#7b8a94",
    armorDark: "#424d57",
    cloth: "#4a4d56",
  },
  robe: {
    label: "法袍",
    armor: "#426fb1",
    armorDark: "#253d70",
    cloth: "#303b73",
  },
  shadow: {
    label: "影衣",
    armor: "#6655a0",
    armorDark: "#382e61",
    cloth: "#31294d",
  },
};

const WEAPONS = {
  shieldSword: {
    label: "剑盾",
    width: "8px",
    height: "70px",
    radius: "2px",
    color: "#d8dadd",
    rotate: "-20deg",
    shape: "polygon(35% 0, 65% 0, 82% 74%, 50% 100%, 18% 74%)",
    offWidth: "38px",
    offHeight: "48px",
    offRadius: "12px 12px 16px 16px",
    offColor: "#8c7a55",
    offShape: "polygon(50% 0, 100% 18%, 82% 86%, 50% 100%, 18% 86%, 0 18%)",
  },
  greatsword: {
    label: "大剑",
    width: "10px",
    height: "100px",
    radius: "2px",
    color: "#d8dadd",
    rotate: "-31deg",
    shape: "polygon(42% 0, 58% 0, 76% 78%, 50% 100%, 24% 78%)",
    offWidth: "12px",
    offHeight: "24px",
    offRadius: "10px",
    offColor: "#d8ad7e",
    offShape: "none",
  },
  dagger: {
    label: "双匕首",
    width: "46px",
    height: "9px",
    radius: "3px",
    color: "#d8dadd",
    rotate: "-12deg",
    shape: "polygon(0 38%, 80% 38%, 100% 50%, 80% 62%, 0 62%)",
    offWidth: "40px",
    offHeight: "8px",
    offRadius: "3px",
    offColor: "#d8dadd",
    offShape: "polygon(0 40%, 82% 40%, 100% 50%, 82% 60%, 0 60%)",
  },
  staff: {
    label: "法杖",
    width: "9px",
    height: "112px",
    radius: "5px",
    color: "#c6a75b",
    rotate: "-10deg",
    shape: "none",
    offWidth: "18px",
    offHeight: "22px",
    offRadius: "50%",
    offColor: "#74d7ff",
    offShape: "none",
  },
  pickaxe: {
    label: "矿镐",
    width: "10px",
    height: "84px",
    radius: "3px",
    color: "#8b6a42",
    rotate: "-46deg",
    shape: "none",
    offWidth: "56px",
    offHeight: "9px",
    offRadius: "5px",
    offColor: "#bfc4c7",
    offShape: "polygon(0 50%, 22% 0, 100% 38%, 100% 62%, 22% 100%)",
  },
  mug: {
    label: "酒杯",
    width: "28px",
    height: "34px",
    radius: "4px",
    color: "#a16a3b",
    rotate: "0deg",
    shape: "polygon(12% 0, 88% 0, 76% 100%, 24% 100%)",
    offWidth: "18px",
    offHeight: "18px",
    offRadius: "50%",
    offColor: "#d8ad7e",
    offShape: "none",
  },
};

const ANIMATIONS = {
  idle: "待机",
  walk: "移动",
  attack: "攻击",
  celebrate: "庆祝",
  drink: "喝酒",
  talk: "讨论",
  dance: "跳舞",
  mine: "挖矿",
};

const state = {
  facing: 1,
  animation: "idle",
  classKey: "warrior",
  armorKey: "iron",
  weaponKey: "greatsword",
};

const els = {
  mount: document.querySelector("#actorMount"),
  animation: document.querySelector("#animationSelect"),
  class: document.querySelector("#classSelect"),
  armor: document.querySelector("#armorSelect"),
  weapon: document.querySelector("#weaponSelect"),
  flip: document.querySelector("#flipBtn"),
  slots: document.querySelector("#slotList"),
  bones: document.querySelector("#boneList"),
  variants: document.querySelector("#variantStrip"),
};

function setup() {
  fillSelect(els.animation, ANIMATIONS, state.animation);
  fillSelect(els.class, mapLabels(CLASSES), state.classKey);
  fillSelect(els.armor, mapLabels(ARMORS), state.armorKey);
  fillSelect(els.weapon, mapLabels(WEAPONS), state.weaponKey);
  renderSystemLists();
  renderVariants();
  renderActor();

  els.animation.addEventListener("change", () => {
    state.animation = els.animation.value;
    renderActor();
  });
  els.class.addEventListener("change", () => {
    state.classKey = els.class.value;
    const classSpec = CLASSES[state.classKey];
    state.weaponKey = classSpec.weapon;
    els.weapon.value = state.weaponKey;
    renderActor();
  });
  els.armor.addEventListener("change", () => {
    state.armorKey = els.armor.value;
    renderActor();
  });
  els.weapon.addEventListener("change", () => {
    state.weaponKey = els.weapon.value;
    renderActor();
  });
  els.flip.addEventListener("click", () => {
    state.facing *= -1;
    renderActor();
  });
}

function mapLabels(source) {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, value.label]));
}

function fillSelect(select, options, selected) {
  select.innerHTML = Object.entries(options)
    .map(([key, label]) => `<option value="${key}">${label}</option>`)
    .join("");
  select.value = selected;
}

function renderSystemLists() {
  els.slots.innerHTML = SLOTS.map(
    ([name, usage]) => `<div class="system-row"><strong>${name}</strong>${usage}</div>`
  ).join("");
  els.bones.innerHTML = BONES.map(
    ([name, usage]) => `<div class="system-row"><strong>${name}</strong>${usage}</div>`
  ).join("");
}

function renderVariants() {
  els.variants.innerHTML = Object.entries(CLASSES)
    .map(([key, spec]) => {
      const mini = spec.mini;
      return `
        <button class="variant-card" type="button" data-class="${key}">
          <div class="mini" style="
            --mini-color:${mini.color};
            --mini-body-width:${mini.bodyWidth};
            --mini-weapon-left:${mini.weaponLeft};
            --mini-weapon-top:${mini.weaponTop};
            --mini-weapon-width:${mini.weaponWidth};
            --mini-weapon-height:${mini.weaponHeight};
            --mini-weapon-rotate:${mini.weaponRotate};
          ">
            <div class="mini-head"></div>
            <div class="mini-body"></div>
            <div class="mini-weapon"></div>
          </div>
          <span><strong>${spec.label}</strong>${spec.note}</span>
        </button>
      `;
    })
    .join("");

  els.variants.querySelectorAll("[data-class]").forEach((button) => {
    button.addEventListener("click", () => {
      state.classKey = button.dataset.class;
      state.weaponKey = CLASSES[state.classKey].weapon;
      els.class.value = state.classKey;
      els.weapon.value = state.weaponKey;
      renderActor();
    });
  });
}

function renderActor() {
  const classSpec = CLASSES[state.classKey];
  const armor = ARMORS[state.armorKey];
  const weapon = WEAPONS[state.weaponKey];
  const actor = document.createElement("div");
  actor.className = "actor";
  actor.dataset.animation = state.animation;
  actor.style.setProperty("--facing", state.facing);
  actor.style.setProperty("--armor", armor.armor || classSpec.armor);
  actor.style.setProperty("--armor-dark", armor.armorDark || classSpec.armorDark);
  actor.style.setProperty("--cloth", armor.cloth || classSpec.cloth);
  actor.style.setProperty("--cape", classSpec.cape);
  actor.style.setProperty("--weapon-width", weapon.width);
  actor.style.setProperty("--weapon-height", weapon.height);
  actor.style.setProperty("--weapon-radius", weapon.radius);
  actor.style.setProperty("--weapon-color", weapon.color);
  actor.style.setProperty("--weapon-rotate", weapon.rotate);
  actor.style.setProperty("--weapon-shape", weapon.shape);
  actor.style.setProperty("--offhand-width", weapon.offWidth);
  actor.style.setProperty("--offhand-height", weapon.offHeight);
  actor.style.setProperty("--offhand-radius", weapon.offRadius);
  actor.style.setProperty("--offhand-color", weapon.offColor);
  actor.style.setProperty("--offhand-shape", weapon.offShape);

  actor.innerHTML = createSkeletonMarkup();
  els.mount.replaceChildren(actor);
}

function createSkeletonMarkup() {
  return `
    <div class="bone root">
      <div class="bone hip">
        <div class="slot"><i class="attachment pelvis"></i></div>
        <div class="bone leg back">
          <div class="slot"><i class="attachment leg-piece"></i></div>
          <div class="bone shin">
            <div class="slot"><i class="attachment shin-piece"></i></div>
            <div class="bone foot"><div class="slot"><i class="attachment foot-piece"></i></div></div>
          </div>
        </div>
        <div class="bone leg front">
          <div class="slot"><i class="attachment leg-piece"></i></div>
          <div class="bone shin">
            <div class="slot"><i class="attachment shin-piece"></i></div>
            <div class="bone foot"><div class="slot"><i class="attachment foot-piece"></i></div></div>
          </div>
        </div>
        <div class="bone spine">
          <div class="slot"><i class="attachment cape-piece"></i></div>
          <div class="bone chest">
            <div class="slot">
              <i class="attachment torso-plate"></i>
              <i class="attachment chest-mark"></i>
              <i class="attachment shoulder back"></i>
              <i class="attachment shoulder front"></i>
            </div>
            <div class="bone upper-arm back">
              <div class="slot"><i class="attachment arm-piece"></i></div>
              <div class="bone forearm back">
                <div class="slot"><i class="attachment forearm-piece"></i></div>
                <div class="bone hand">
                  <div class="slot">
                    <i class="attachment hand-piece"></i>
                    <i class="attachment offhand-piece"></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="bone upper-arm front">
              <div class="slot"><i class="attachment arm-piece"></i></div>
              <div class="bone forearm front">
                <div class="slot"><i class="attachment forearm-piece"></i></div>
                <div class="bone hand">
                  <div class="slot">
                    <i class="attachment hand-piece"></i>
                    <i class="attachment weapon-piece"></i>
                    <i class="attachment fx-piece"></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="bone neck">
              <div class="slot"><i class="attachment neck-piece"></i></div>
              <div class="bone head-bone">
                <div class="slot">
                  <i class="attachment head-piece"></i>
                  <i class="attachment face-plane"></i>
                  <i class="attachment hair"></i>
                  <i class="attachment eye"></i>
                  <i class="attachment nose"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

setup();

