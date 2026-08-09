---
title: Turn coding agents into a controlled delivery workflow.
description: Move from work item to merged request with workflows that select the right skills, keep mutations explicit, and synchronize your providers.
head:
  - tag: title
    content: agent-workflows - controlled delivery workflows for coding agents
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
  title: Turn coding agents into a controlled delivery workflow.
  tagline: From work item to merged request, agent-workflows selects and sequences the right skills, keeps every mutation explicit, and synchronizes your providers.
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
    - text: Install agent-workflows
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

  <section class="landing-section landing-intro">
    <div>
      <p class="landing-eyebrow">A workflow layer for your agent</p>
      <h2>Your agent has skills. It still needs a delivery system.</h2>
    </div>
    <div>
      <p>Skills can shape ideas, plan changes, write code, and review requests. On their own, they do not decide what happens next, who may change an external system, or when you should approve the work.</p>
      <p><code>agent-workflows</code> gives those skills one controlled lifecycle. Each command owns a clear outcome, carries context forward, and stops at the right boundary.</p>
    </div>
  </section>

  <section class="landing-section landing-lifecycle" aria-labelledby="lifecycle-title">
    <p class="landing-eyebrow">One connected lifecycle</p>
    <h2 id="lifecycle-title">From rough intent to completed work.</h2>
    <div class="lifecycle-flow" aria-label="Shape, plan, deliver, and review">
      <article>
        <span>01</span>
        <h3>Shape</h3>
        <p>Turn intent into a clear, right-sized work item.</p>
        <code>/write · /refine</code>
      </article>
      <article>
        <span>02</span>
        <h3>Plan</h3>
        <p>Select the work and approve how it will be delivered.</p>
        <code>/pick · /plan</code>
      </article>
      <article>
        <span>03</span>
        <h3>Deliver</h3>
        <p>Execute the plan, validate the result, and prepare review.</p>
        <code>/work · /ready</code>
      </article>
      <article>
        <span>04</span>
        <h3>Review</h3>
        <p>Inspect an exact snapshot, merge it, and complete the item.</p>
        <code>/inspect · /done</code>
      </article>
    </div>
    <a class="landing-text-link" href="/agent-workflows/workflows/">Explore all workflows <span aria-hidden="true">→</span></a>
  </section>

  <section class="landing-section landing-control" aria-labelledby="control-title">
    <div class="landing-control__heading">
      <p class="landing-eyebrow">Control is part of the workflow</p>
      <h2 id="control-title">Autonomy where it helps. Approval where it matters.</h2>
    </div>
    <div class="landing-control__grid">
      <article>
        <span>Route</span>
        <h3>Context-aware skills</h3>
        <p>The workflow selects only the specialist skills the current activity needs.</p>
      </article>
      <article>
        <span>Confirm</span>
        <h3>Explicit mutations</h3>
        <p>Commits, pushes, reviews, merges, and provider updates stay behind clear approval boundaries.</p>
      </article>
      <article>
        <span>Sync</span>
        <h3>Connected providers</h3>
        <p>Keep Linear or ClickUp aligned with GitHub or GitLab throughout delivery.</p>
      </article>
    </div>
  </section>

  <section class="landing-cta">
    <div>
      <p class="landing-eyebrow">Start with one command</p>
      <h2>Add the workflow layer to your coding agent.</h2>
    </div>
    <div class="landing-cta__actions">
      <code>npx skills add cyrilichti/agent-workflows --skill agent-workflows</code>
      <a href="/agent-workflows/installation/">Installation guide <span aria-hidden="true">→</span></a>
    </div>
  </section>
</div>
