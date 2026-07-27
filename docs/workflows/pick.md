---
title: /pick
description: Prepare one ready item for implementation with an approved plan.
---

`/pick` prepares one item for implementation. It keeps the provider as the
source of truth and only marks the item as in progress after plan approval. If
the item needs refinement, it stops without changing it.

## How this workflow is structured

<table class="workflow-steps">
  <tbody>
    <tr>
      <td>1</td>
      <th scope="row">Provider</th>
      <td>Load the configured item provider.</td>
    </tr>
    <tr>
      <td>2</td>
      <th scope="row">Retrieve</th>
      <td>List items that are ready to start.</td>
    </tr>
    <tr>
      <td>3</td>
      <th scope="row">Select</th>
      <td>Choose one official item.</td>
    </tr>
    <tr>
      <td>4</td>
      <th scope="row">Summarize</th>
      <td>Present the item's complete context.</td>
    </tr>
    <tr>
      <td>5</td>
      <th scope="row">Plan</th>
      <td>Approve an implementation plan or stop for refinement.</td>
    </tr>
    <tr>
      <td>6</td>
      <th scope="row">Activate</th>
      <td>Move the item to in progress.</td>
    </tr>
    <tr>
      <td>7</td>
      <th scope="row">Work</th>
      <td>Start implementation with the approved plan.</td>
    </tr>
  </tbody>
</table>
