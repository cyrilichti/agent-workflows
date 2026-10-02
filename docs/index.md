---
title: Turn tickets into reviewed code.
description: Route the right skills from ticket to plan, code, and review, automate the delivery loop, and keep the final say on merge.
head:
  - tag: title
    content: Agent Workflows - turn tickets into reviewed code
  - tag: meta
    attrs:
      property: og:image
      content: https://cyrilichti.github.io/agent-workflows/readme-lifecycle.svg
  - tag: meta
    attrs:
      property: og:image:width
      content: "1640"
  - tag: meta
    attrs:
      property: og:image:height
      content: "460"
  - tag: meta
    attrs:
      name: twitter:image
      content: https://cyrilichti.github.io/agent-workflows/readme-lifecycle.svg
template: splash
editUrl: false
hero:
  layout: media-left
  title: Turn tickets into reviewed code.
  tagline: Agent Workflows routes the right skills from ticket to plan, code, and review—automating the delivery loop while you keep the final say on merge.
  image:
    html: |-
      <section class="workflow-demo" aria-label="A ticket-to-merge conversation demo" data-workflow-demo>
        <div class="workflow-demo__bar">
          <span class="workflow-demo__lights" aria-hidden="true"><i></i><i></i><i></i></span>
          <span>agent-workflows / demo</span>
          <span class="workflow-demo__status">scripted</span>
        </div>
        <div class="workflow-demo__scenes">
          <article class="workflow-demo__scene" data-demo-scene>
            <p class="workflow-demo__phase">01 / Shape the request</p>
            <div class="workflow-demo__message workflow-demo__message--user"><b>You</b><p data-demo-typing>I want to create a ticket for AI search.</p></div>
            <div class="workflow-demo__message workflow-demo__message--agent" data-demo-answer><b>Agent</b><p>Who needs to search, and what should they be able to find? That will help us define success.</p></div>
            <div class="workflow-demo__behind" data-demo-behind><h3>Behind the scenes</h3><ul>
              <li><span>Workflow</span><p><a class="workflow-demo__workflow" href="/agent-workflows/workflows/write/">/write</a> guides the ticket conversation.</p></li>
              <li><span>Skill</span><p>One best fit at a time: <span class="workflow-demo__skill-list"><a class="workflow-demo__skill workflow-demo__skill--active" href="https://github.com/addyosmani/agent-skills/tree/main/skills/idea-refine">idea-refine</a><a class="workflow-demo__skill" href="https://github.com/addyosmani/agent-skills/tree/main/skills/interview-me">interview-me</a><a class="workflow-demo__skill" href="https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling">grilling</a><a class="workflow-demo__skill" href="https://github.com/mattpocock/skills/tree/main/skills/engineering/to-spec">to-spec</a></span></p></li>
            </ul></div>
          </article>
          <article class="workflow-demo__scene" data-demo-scene>
            <p class="workflow-demo__phase">02 / Save and plan</p>
            <div class="workflow-demo__message workflow-demo__message--user"><b>You</b><p data-demo-typing>People need to find answers in our docs. That ticket looks right; save it and plan the work.</p></div>
            <div class="workflow-demo__message workflow-demo__message--agent" data-demo-answer><b>Agent</b><p>The ticket is in Linear. I’ve prepared a plan with checks for the search experience. Do you approve it?</p></div>
            <div class="workflow-demo__behind" data-demo-behind><h3>Behind the scenes</h3><ul>
              <li><span>Integration</span><p>Linear receives the approved ticket.</p></li>
              <li><span>Workflow</span><p><a class="workflow-demo__workflow" href="/agent-workflows/workflows/plan/">/plan</a> turns it into verifiable steps.</p></li>
              <li><span>Skill</span><p><a class="workflow-demo__skill workflow-demo__skill--active" href="https://github.com/addyosmani/agent-skills/tree/main/skills/planning-and-task-breakdown">planning-and-task-breakdown</a> orders the work.</p></li>
              <li><span>Validation</span><p>Execution waits for your approval.</p></li>
            </ul></div>
          </article>
          <article class="workflow-demo__scene" data-demo-scene>
            <p class="workflow-demo__phase">03 / Build and check</p>
            <div class="workflow-demo__message workflow-demo__message--user"><b>You</b><p data-demo-typing>Approved. Go ahead.</p></div>
            <div class="workflow-demo__message workflow-demo__message--agent" data-demo-answer><b>Agent</b><p>I’m building the search and checking it against the plan. Then I’ll open a request for review.</p></div>
            <div class="workflow-demo__behind" data-demo-behind><h3>Behind the scenes</h3><ul>
              <li><span>Workflow</span><p><a class="workflow-demo__workflow" href="/agent-workflows/workflows/work/">/work</a> implements the approved plan.</p></li>
              <li><span>Profile</span><p><code>ai-engineer</code> handles the search feature.</p></li>
              <li><span>Validation</span><p>Checks run before the request is prepared.</p></li>
              <li><span>Workflow</span><p><a class="workflow-demo__workflow" href="/agent-workflows/workflows/ready/">/ready</a> prepares the request.</p></li>
            </ul></div>
          </article>
          <article class="workflow-demo__scene" data-demo-scene>
            <p class="workflow-demo__phase">04 / Review</p>
            <div class="workflow-demo__message workflow-demo__message--agent"><b>Agent</b><p data-demo-typing>The request is ready. I’ve reviewed it against the ticket and plan. No blocking findings remain; it’s ready for your merge decision.</p></div>
            <div class="workflow-demo__behind" data-demo-behind><h3>Behind the scenes</h3><ul>
              <li><span>Workflow</span><p><a class="workflow-demo__workflow" href="/agent-workflows/workflows/inspect/">/inspect</a> reviews a specific request version.</p></li>
              <li><span>Profile</span><p><code>reviewer</code> checks for defects and gaps.</p></li>
              <li><span>Validation</span><p>The result is submitted for human review.</p></li>
            </ul></div>
          </article>
          <article class="workflow-demo__scene" data-demo-scene>
            <p class="workflow-demo__phase">05 / Merge and close</p>
            <div class="workflow-demo__message workflow-demo__message--user"><b>You</b><p data-demo-typing>Merge it.</p></div>
            <div class="workflow-demo__message workflow-demo__message--agent" data-demo-answer><b>Agent</b><p>Merged to main. The Linear ticket is now complete.</p></div>
            <div class="workflow-demo__behind" data-demo-behind><h3>Behind the scenes</h3><ul>
              <li><span>Workflow</span><p><a class="workflow-demo__workflow" href="/agent-workflows/workflows/done/">/done</a> merges after your confirmation.</p></li>
              <li><span>Integration</span><p>Linear records the completed ticket.</p></li>
            </ul></div>
          </article>
        </div>
      </section>
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
          <div><small>Human</small><strong>Start</strong></div>
        </div>
        <span class="delivery-connector" aria-hidden="true">→</span>
        <div class="delivery-loop">
          <span class="delivery-loop__label">Autonomous delivery loop</span>
          <article class="delivery-stage delivery-stage--autonomous delivery-stage--deliver">
            <header><span>03</span><small>Autonomous</small></header>
            <h3>Deliver</h3>
            <code>/work · /ready</code>
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

<script src="/agent-workflows/workflow-demo.js" defer></script>
