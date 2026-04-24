import { AXIS_META, QUESTIONS, TYPE_PROFILES } from "./mbti-data.js";

const quizRoot = document.querySelector("[data-quiz-root]");
const TYPE_VISUAL_POSITIONS = {
  INTJ: { x: "0%", y: "0%" },
  INTP: { x: "33.333%", y: "0%" },
  ENTJ: { x: "66.666%", y: "0%" },
  ENTP: { x: "100%", y: "0%" },
  INFJ: { x: "0%", y: "33.333%" },
  INFP: { x: "33.333%", y: "33.333%" },
  ENFJ: { x: "66.666%", y: "33.333%" },
  ENFP: { x: "100%", y: "33.333%" },
  ISTJ: { x: "0%", y: "66.666%" },
  ISFJ: { x: "33.333%", y: "66.666%" },
  ESTJ: { x: "66.666%", y: "66.666%" },
  ESFJ: { x: "100%", y: "66.666%" },
  ISTP: { x: "0%", y: "100%" },
  ISFP: { x: "33.333%", y: "100%" },
  ESTP: { x: "66.666%", y: "100%" },
  ESFP: { x: "100%", y: "100%" },
};
if (quizRoot) {
  initQuiz();
}

function initQuiz() {
  const introCard = document.querySelector("[data-quiz-intro]");
  const landingCover = document.querySelector("[data-landing-cover]");
  const form = document.querySelector("[data-quiz-form]");
  const stepContent = document.querySelector("[data-step-content]");
  const resultPanel = document.querySelector("[data-result-panel]");
  const resultContent = document.querySelector("[data-result-content]");
  const progressFill = document.querySelector("[data-progress-fill]");
  const stepKicker = document.querySelector("[data-step-kicker]");
  const stepCount = document.querySelector("[data-step-count]");
  const prevButton = document.querySelector("[data-prev-step]");
  const nextButton = document.querySelector("[data-next-step]");
  const startButtons = document.querySelectorAll("[data-start-quiz]");
  const restartButton = document.querySelector("[data-restart-quiz]");

  const state = {
    step: -1,
    basics: {
      petName: "",
      petType: "",
    },
    answers: {},
  };

  startButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      startQuiz();
    });
  });

  prevButton.addEventListener("click", function () {
    if (state.step > 0) {
      state.step -= 1;
      renderStep();
    }
  });

  form.addEventListener("input", function (event) {
    const target = event.target;

    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) {
      return;
    }

    if (target.name in state.basics) {
      state.basics[target.name] = target.value;
      updateActionState();
      return;
    }

    if (target.type === "radio") {
      state.answers[target.name] = Number(target.value);
      updateActionState();

      window.setTimeout(function () {
        if (isQuestionStep() && hasCurrentAnswer()) {
          goNext();
        }
      }, 180);
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    goNext();
  });

  if (restartButton) {
    restartButton.addEventListener("click", function () {
      state.step = 0;
      state.answers = {};
      resultPanel.hidden = true;
      form.hidden = false;
      form.classList.add("is-visible");
      renderStep();
    });
  }

  if (window.location.hash === "#quiz-app" || window.location.hash === "#start") {
    startQuiz();
  }

  function startQuiz() {
    state.step = 0;
    if (landingCover && !landingCover.hidden) {
      landingCover.classList.add("is-exiting");
      window.setTimeout(function () {
        landingCover.hidden = true;
        resultPanel.hidden = true;
        form.hidden = false;
        form.classList.add("is-visible");
        renderStep();
      }, 260);
      return;
    }

    if (introCard) {
      introCard.hidden = true;
    }
    resultPanel.hidden = true;
    form.hidden = false;
    form.classList.add("is-visible");
    renderStep();
  }

  function renderStep() {
    const totalSteps = QUESTIONS.length + 1;
    const progressPercent = ((state.step + 1) / totalSteps) * 100;

    progressFill.style.width = progressPercent + "%";
    prevButton.hidden = state.step === 0;

    if (state.step === 0) {
      stepKicker.textContent = "准备信息";
      stepCount.textContent = "第 1 / 13 步";
      nextButton.textContent = "进入第 1 题";
      stepContent.innerHTML = renderBasicsStep();
    } else {
      const question = QUESTIONS[state.step - 1];
      stepKicker.textContent = "正在答题";
      stepCount.textContent = "第 " + (state.step + 1) + " / 13 步";
      nextButton.textContent =
        state.step === QUESTIONS.length ? "查看结果" : "下一题";
      stepContent.innerHTML = renderQuestionStep(question, state.step - 1);
    }

    updateActionState();
  }

  function renderBasicsStep() {
    return `
      <div class="wizard-step">
        <span class="step-badge">基础资料</span>
        <h2>先认识一下今天的主角。</h2>
        <p class="step-note">这些信息会帮助结果描述更贴近真实场景。</p>

        <div class="field-grid">
          <label class="field">
            <span>宠物名字</span>
            <input
              type="text"
              name="petName"
              placeholder="例如：布丁、糯米"
              value="${escapeAttr(state.basics.petName)}"
              required
            />
          </label>

          <label class="field">
            <span>宠物类型</span>
            <select name="petType" required>
              ${renderSelectOptions(
                ["", "猫咪", "狗狗", "兔兔", "仓鼠", "其他毛孩子"],
                state.basics.petType
              )}
            </select>
          </label>
        </div>
      </div>
    `;
  }

  function renderQuestionStep(question, index) {
    const currentValue = state.answers[question.id];

    return `
      <div class="wizard-step">
        <div class="question-topline">
          <span class="step-badge">问题 ${index + 1}</span>
        </div>
        <h2>${question.title}</h2>

        <div class="choice-grid">
          ${question.choices
            .map(function (choice) {
              const checked = currentValue === choice.value ? "checked" : "";
              return `
                <label class="choice-card">
                  <input
                    type="radio"
                    name="${question.id}"
                    value="${choice.value}"
                    ${checked}
                  />
                  <span class="choice-title">${choice.label}</span>
                  <small>${choice.desc}</small>
                </label>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function updateActionState() {
    if (state.step === 0) {
      nextButton.disabled = !isBasicsComplete();
      return;
    }

    nextButton.disabled = !hasCurrentAnswer();
  }

  function goNext() {
    if (state.step === 0 && !isBasicsComplete()) {
      return;
    }

    if (isQuestionStep() && !hasCurrentAnswer()) {
      return;
    }

    if (state.step < QUESTIONS.length) {
      state.step += 1;
      renderStep();
      return;
    }

    renderResult();
  }

  function renderResult() {
    const scores = {
      EI: 0,
      SN: 0,
      TF: 0,
      JP: 0,
    };

    QUESTIONS.forEach(function (question) {
      scores[question.dimension] += state.answers[question.id] - 3;
    });

    const letters = [
      scores.EI >= 0 ? "E" : "I",
      scores.SN >= 0 ? "N" : "S",
      scores.TF >= 0 ? "F" : "T",
      scores.JP >= 0 ? "P" : "J",
    ].join("");

    const profile = TYPE_PROFILES[letters];
    const dimensionCards = buildDimensionCards(scores);
    const tips = buildTips(letters, state.basics);
    const tags = buildTags(letters, state.basics);
    const visualStyle = getTypeVisualStyle(letters);

    resultContent.innerHTML = `
      <div class="result-header">
        <div class="result-hero">
          <div class="result-portrait-wrap">
            <div
              class="result-portrait"
              style="${visualStyle}"
              role="img"
              aria-label="${letters} 宠物人格结果图"
            ></div>
            <div class="result-type-badge">${letters}</div>
          </div>
          <div>
            <p class="result-subtitle">${state.basics.petType}</p>
            <h2 class="result-name">${escapeHtml(state.basics.petName)} 的人格类型是 ${letters}</h2>
            <p class="result-copy">
              专属昵称：<strong>${profile.nickname}</strong><br />
              ${profile.headline}
            </p>
          </div>
        </div>

        <div class="result-tags">
          ${tags
            .map(function (tag) {
              return `<span class="result-tag">${tag}</span>`;
            })
            .join("")}
        </div>
      </div>

      <div class="result-grid">
        <article class="result-box">
          <h3>性格总览</h3>
          <p>${profile.summary}</p>
          <p><strong>闪光点：</strong>${profile.spotlight}</p>
        </article>

        <article class="result-box">
          <h3>观察依据</h3>
          <p>
            这份结果综合了社交取向、新奇寻求、情绪线索敏感度与结构偏好四个维度，
            它更适合作为理解宠物沟通方式的标签，而不是医疗或行为诊断结论。
          </p>
        </article>

        <div class="dimension-grid">
          ${dimensionCards}
        </div>

        <div class="tips-grid">
          <article class="result-box">
            <h3>主人日常建议</h3>
            <ul class="tip-list">
              ${tips.owner
                .map(function (tip) {
                  return `<li>${tip}</li>`;
                })
                .join("")}
            </ul>
          </article>

          <article class="result-box">
            <h3>互动建议</h3>
            <ul class="tip-list">
              ${tips.play
                .map(function (tip) {
                  return `<li>${tip}</li>`;
                })
                .join("")}
            </ul>
          </article>
        </div>
      </div>
    `;

    form.hidden = true;
    resultPanel.hidden = false;
    resultPanel.classList.add("is-visible");
  }

  function isBasicsComplete() {
    return Boolean(state.basics.petName.trim() && state.basics.petType);
  }

  function isQuestionStep() {
    return state.step > 0 && state.step <= QUESTIONS.length;
  }

  function hasCurrentAnswer() {
    if (!isQuestionStep()) {
      return false;
    }

    const currentQuestion = QUESTIONS[state.step - 1];
    return Number.isFinite(state.answers[currentQuestion.id]);
  }
}

function renderSelectOptions(options, selected) {
  return options
    .map(function (option) {
      const value = option === "" ? "" : option;
      const label = option === "" ? "请选择" : option;
      const isSelected = value === selected ? "selected" : "";
      return `<option value="${escapeAttr(value)}" ${isSelected}>${label}</option>`;
    })
    .join("");
}

function buildDimensionCards(scores) {
  return Object.entries(AXIS_META)
    .map(function ([dimension, meta]) {
      const score = scores[dimension];
      const letter = score >= 0 ? getRightPole(dimension) : getLeftPole(dimension);
      const summary = meta.letters[letter];
      const strength = Math.min(100, Math.round((Math.abs(score) / 6) * 100) + 18);

      return `
        <article class="dimension-item">
          <h4>${meta.title}</h4>
          <p><strong>${summary.label}</strong></p>
          <p>${summary.summary}</p>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${strength}%"></div>
          </div>
        </article>
      `;
    })
    .join("");
}

function buildTips(type, basics) {
  const letters = type.split("");
  const axisTips = [
    AXIS_META.EI.letters[letters[0]].tip,
    AXIS_META.SN.letters[letters[1]].tip,
    AXIS_META.TF.letters[letters[2]].tip,
    AXIS_META.JP.letters[letters[3]].tip,
  ];

  return {
    owner: [
      axisTips[0],
      axisTips[2],
      basics.petType === "猫咪"
        ? "猫咪如果偏慢热或结构型，通常更需要稳定躲藏点、高处休息区和可预期的互动距离。"
        : "如果它属于高互动类型，可以把陪玩拆成短频快的小段，让精力释放更均匀。",
      "如果近期行为突然和这个画像差异很大，优先排查健康、环境压力和作息变化。",
    ],
    play: [
      axisTips[1],
      axisTips[3],
      letters[2] === "F"
        ? "互动时多用语气、眼神和夸奖强化安全感，它通常会比单纯命令更愿意配合。"
        : "设计带目标的小任务，例如找零食、定点取物、障碍穿越，会让它更有成就感。",
      "每次新训练都建议从低刺激环境开始，再慢慢增加变化，成功率通常会更高。",
    ],
  };
}

function buildTags(type, basics) {
  const profile = TYPE_PROFILES[type];
  return [
    "昵称：" + profile.nickname,
    "类型：" + type,
    basics.petType + "观察样本",
  ];
}

function getTypeVisualStyle(type) {
  const position = TYPE_VISUAL_POSITIONS[type] || { x: "50%", y: "50%" };
  return `--bg-x:${position.x}; --bg-y:${position.y};`;
}

function getLeftPole(dimension) {
  return QUESTIONS.find(function (question) {
    return question.dimension === dimension;
  }).leftPole;
}

function getRightPole(dimension) {
  return QUESTIONS.find(function (question) {
    return question.dimension === dimension;
  }).rightPole;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
