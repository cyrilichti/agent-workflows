---
title: Make specialized agent skills work together.
description: Install controlled workflows that select and sequence the right skills, keep approvals explicit, and connect work items to providers.
head:
  - tag: title
    content: agent-workflows - make agent skills work together
template: splash
editUrl: false
hero:
  layout: media-left
  title: Make specialized agent skills work together.
  tagline: Install controlled workflows that select and sequence the right skills, keep approvals explicit, and connect work items to providers.
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
    - text: Get started
      link: /agent-workflows/installation/
      icon: right-arrow
    - text: Explore workflows
      link: /agent-workflows/workflows/
      icon: open-book
      variant: secondary
---
