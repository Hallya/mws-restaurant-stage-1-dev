# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 1

For the **Restaurant Reviews** projects, I had to incrementally convert a static webpage to a mobile-ready web application. In **Stage One**, I had a static design that lacked accessibility and I converted the design to be responsive on different sized displays and accessible for screen reader use. I had also to add a service worker to begin the process of creating a seamless offline experience for users.

### Specification

I had been provided the code for a restaurant reviews website. The code had a lot of issues. It was barely usable on a desktop browser, much less a mobile device. It also didn't include any standard accessibility features, and it didn't work offline at all. My job was to update the code to resolve these issues while still maintaining the included functionality. 

### What did I do from here?

1. In this folder, I started up a simple HTTP server to serve up the site files on my local computer. Python has some simple tools to do this, and I didn't even need to know Python. For most people, it's already installed on their computer. 

2. With my server running, I visited the site: `http://localhost:8000`, and looked around for a bit to see what the current experience looked like.
3. I explored the provided code, and started making a plan to implement the required features in three areas: responsive design, accessibility and offline use.
4. I wrote code to implement the updates to get this site on its way to be a mobile-ready website.

### Note about ES6

Most of the code in this project has been written to the ES6 JavaScript specification for compatibility with modern web browsers and future proofing JavaScript code. As much as possible, I tried to maintain use of ES6 in any additional JavaScript I wrote. 

## Project Overview: Stage 2

In **Stage Two**, I took the responsive, accessible design I built in **Stage One** and connect it to an external server. I began by using asynchronous JavaScript to request JSON data from the server. I stored data received from the server in an offline database using IndexedDB, which created an app shell architecture. Finally, I worked to optimize my site to meet performance benchmarks, which I would test using Lighthouse.

### Specification

I have been provided code for a Node development server and a README for getting the server up and running locally on my computer. The README also contained the API I needed to make JSON requests to the server. Once I had the server up, I began the work of improving my Stage One project code.

The core functionality of the application had not change for this stage. Only the source of the data had. I used the fetch() API to make requests to the server to populate the content of my Restaurant Reviews app.

### Requirements

Use of server data instead of local memory In the first version of the application, all of the data for the restaurants was stored in the local application. I needed to change this behavior so that I was pulling all of my data from the server instead, and using the response data to generate the restaurants informations on the main page and the detail page.

I used IndexedDB to cache JSON responses In order to maintain offline use with the development server. I needed to update the service worker to store the JSON received by my requests using the IndexedDB API. As with Stage One, any page that has been visited by the user should be available offline, with data pulled from the shell database.

I had to meet the minimum performance requirements Once I had my app working with the server and working in offline mode, I needed to measure the site's performance using Lighthouse.

Lighthouse measures performance in five areas, but my review will focus on three:

1. Progressive Web App score should be at 90 or better.
2. Performance score should be at 70 or better.
3. Accessibility score should be at 90 or better.
