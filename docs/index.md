---
title: Turn tickets into reviewed code.
description: Route the right skills from ticket to plan, code, and review, automate the delivery loop, and keep the final say on merge.
head:
  - tag: title
    content: Agent Workflows - turn tickets into reviewed code
  - tag: meta
    attrs:
      property: og:image
      content: https://cyrilichti.github.io/agent-workflows/og.png
  - tag: meta
    attrs:
      property: og:image:width
      content: "1730"
  - tag: meta
    attrs:
      property: og:image:height
      content: "909"
  - tag: meta
    attrs:
      name: twitter:image
      content: https://cyrilichti.github.io/agent-workflows/og.png
template: splash
editUrl: false
hero:
  layout: media-left
  title: Turn tickets into reviewed code.
  tagline: Agent Workflows routes the right skills from ticket to plan, code, and review—automating the delivery loop while you keep the final say on merge.
  image:
    html: |-
      <div class="workflow-hero-media" role="img" aria-label="The write workflow dispatching to the idea-refine skill with Linear as the active provider">
        <div class="workflow-hero-media__bar">
          <span class="workflow-hero-media__lights" aria-hidden="true"><i></i><i></i><i></i></span>
          <code>workflow.run</code>
          <span class="workflow-hero-media__status">controlled</span>
        </div>
        <div class="workflow-hero-media__body">
          <div class="workflow-hero-step workflow-hero-step--active">
            <span class="workflow-hero-step__index">01</span>
            <div><small>workflow</small><strong>/write</strong><em>owns the sequence</em></div>
          </div>
          <div class="workflow-hero-connector"><span></span><small>dispatch</small></div>
          <div class="workflow-hero-skills">
            <div><small>best-fit skills</small><span>context aware</span></div>
            <ul>
              <li>interview-me</li>
              <li class="workflow-hero-skill--active">idea-refine</li>
              <li>grilling</li>
              <li>to-spec</li>
            </ul>
          </div>
          <div class="workflow-hero-provider">
            <small>provider</small><span>ClickUp</span><span class="workflow-hero-provider--active">Linear</span>
          </div>
        </div>
      </div>
  actions:
    - text: Install Agent Workflows
      link: /agent-workflows/installation/
      icon: right-arrow
    - text: See the workflow
      link: /agent-workflows/workflows/
      icon: open-book
      variant: secondary
---

<div class="landing-page">
  <section class="landing-proof" aria-label="Product facts">
    <div><strong>8</strong><span>workflows</span></div>
    <div><strong>4</strong><span>provider integrations</span></div>
    <div><strong>34</strong><span>specialized skills</span></div>
  </section>

  <section class="landing-section landing-lifecycle" aria-labelledby="lifecycle-title">
    <p class="landing-eyebrow">One governed delivery chain</p>
    <h2 id="lifecycle-title">From ticket to merge, one continuous workflow.</h2>
    <p class="landing-lifecycle__intro">Start with a new or existing ticket. Agent Workflows carries its context through planning, implementation, and review—routing the right skills at each step while you decide when to merge.</p>
    <div class="delivery-map" role="img" aria-label="Agent Workflows lifecycle: shape a ticket, plan the work, start autonomous delivery, loop between delivery and review until no blocking findings remain, then make a human merge decision.">
      <div class="delivery-map__stages">
        <article class="delivery-stage delivery-stage--assisted">
          <header><span>01</span><small>Assisted</small></header>
          <h3>Shape</h3>
          <code>/write · /refine</code>
        </article>
        <span class="delivery-connector" aria-hidden="true">→</span>
        <article class="delivery-stage delivery-stage--assisted">
          <header><span>02</span><small>Assisted</small></header>
          <h3>Plan</h3>
          <code>/pick · /plan</code>
        </article>
        <span class="delivery-connector" aria-hidden="true">→</span>
        <div class="delivery-map__start">
          <span class="delivery-map__human-mark" aria-hidden="true"></span>
          <small>Human</small>
          <strong>Start</strong>
        </div>
        <span class="delivery-connector" aria-hidden="true">→</span>
        <div class="delivery-loop">
          <span class="delivery-loop__label">Autonomous delivery loop</span>
          <article class="delivery-stage delivery-stage--autonomous delivery-stage--deliver">
            <header><span>03</span><small>Autonomous</small></header>
            <h3>Deliver</h3>
            <code>/work · /ready</code>
            <strong class="delivery-stage__action">Commit</strong>
          </article>
          <article class="delivery-stage delivery-stage--autonomous delivery-stage--review">
            <header><span>04</span><small>Autonomous</small></header>
            <h3>Review</h3>
            <code>/inspect</code>
          </article>
          <div class="delivery-loop__lines" aria-hidden="true"><span class="delivery-loop__line delivery-loop__line--forward"></span><span class="delivery-loop__line delivery-loop__line--return"></span></div>
          <span class="delivery-loop__return-label">Blocking findings</span>
        </div>
        <span class="delivery-connector" aria-hidden="true">→</span>
        <div class="delivery-map__merge">
          <span class="delivery-map__human-mark" aria-hidden="true"></span>
          <div><small>Human</small><strong>Merge</strong><code>/done</code></div>
        </div>
      </div>
    </div>
    <a class="landing-text-link" href="/agent-workflows/workflows/">Explore all workflows <span aria-hidden="true">→</span></a>
  </section>

  <section class="landing-cta">
    <div>
      <p class="landing-eyebrow">Start with one command</p>
      <h2>Add a governed delivery workflow to your coding agent.</h2>
    </div>
    <div class="landing-cta__actions">
      <code>npx skills add cyrilichti/agent-workflows --skill agent-workflows</code>
      <a href="/agent-workflows/installation/">Installation guide <span aria-hidden="true">→</span></a>
    </div>
  </section>
</div>
