export const sampleDocuments = [
    {
        title: "What is Docker",
        content: `Docker is an open-source platform that automates the deployment, scaling, and management of applications using containerization. A container is a lightweight, standalone, executable package that includes everything needed to run a piece of software: the code, runtime, system tools, libraries, and settings.

Unlike virtual machines, containers share the host operating system's kernel, making them significantly lighter and faster to start. A typical container can boot in seconds, while a virtual machine might take minutes. This efficiency makes containers ideal for microservices architectures where you need to run many small services simultaneously.

Docker uses a Dockerfile to define how an image is built. A Dockerfile contains instructions like FROM (base image), COPY (add files), RUN (execute commands), and CMD (default command). When you build a Dockerfile, it creates an image — a read-only template. When you run an image, it becomes a container — a running instance with its own writable layer.

Docker Compose is a tool for defining and running multi-container applications. You write a docker-compose.yml file that describes all your services (web server, database, cache), their configurations, and how they connect. A single command, docker-compose up, starts everything together. This is essential for local development where you need a database, Redis, and your app all running together.

Docker Hub is a cloud-based registry where you can find and share container images. Official images for popular software like Node.js, PostgreSQL, Redis, and Nginx are available. You can also push your own custom images to Docker Hub or use private registries like AWS ECR or Google Container Registry.

In production, Docker containers are typically orchestrated using Kubernetes or Docker Swarm. These tools handle scaling containers up or down based on load, restarting failed containers, rolling out updates without downtime, and distributing containers across multiple machines. Docker fundamentally changed how software is deployed by making environments reproducible and portable.`
    },
    {
        title: "REST vs GraphQL",
        content: `REST (Representational State Transfer) and GraphQL are two approaches for building APIs that allow clients to communicate with servers. REST has been the dominant API paradigm since the mid-2000s, while GraphQL was developed by Facebook in 2012 and open-sourced in 2015.

REST APIs organize resources around URLs. Each URL represents a resource (like /users, /posts, /comments), and you use HTTP methods to interact with them: GET to read, POST to create, PUT to update, DELETE to remove. REST is simple, widely understood, and works well with HTTP caching. Most web developers learn REST first.

The main problem with REST is over-fetching and under-fetching. If you request GET /users/123, the server returns ALL fields for that user — even if you only need the name and email. That is over-fetching. Conversely, if you need a user's posts and comments too, you need three separate requests: /users/123, /users/123/posts, /users/123/comments. That is under-fetching, also called the N+1 problem.

GraphQL solves both problems with a single endpoint and a query language. Instead of multiple URLs, there is one endpoint (typically /graphql). The client sends a query specifying exactly what data it needs. For example, you can request a user's name, their last 5 posts, and the comments on each post — all in one request. The server returns exactly that shape of data, nothing more and nothing less.

GraphQL uses a strongly-typed schema that defines all available data types and their relationships. This schema serves as documentation and enables powerful developer tools like auto-completion and validation. Mutations handle writes (create, update, delete), and subscriptions enable real-time updates over WebSockets.

However, GraphQL has trade-offs. It is more complex to set up than REST. HTTP caching does not work out of the box since all requests go to one endpoint. Query complexity can lead to performance issues if clients request deeply nested data. Rate limiting is harder because a single request can fetch vastly different amounts of data.

For simple CRUD applications with predictable data needs, REST is often the better choice. For complex applications with varied data requirements, multiple clients (web, mobile, IoT), or rapidly evolving frontends, GraphQL shines. Many teams use both: REST for simple services and GraphQL as a gateway aggregating multiple REST APIs.`
    },
    {
        title: "How React Hooks Work",
        content: `React Hooks were introduced in React 16.8 to allow function components to use state and other React features that were previously only available in class components. Hooks simplify component logic, make code more reusable, and eliminate the confusion around the 'this' keyword in JavaScript classes.

The most fundamental hook is useState. It returns a pair: the current state value and a function to update it. When you call the updater function, React re-renders the component with the new value. Unlike class component state, useState can hold any type — a number, string, array, object, or even null. You can use multiple useState calls in one component, each managing an independent piece of state.

useEffect is the second most important hook. It handles side effects — operations that interact with the outside world, like API calls, subscriptions, timers, or DOM manipulation. useEffect takes a function that runs after every render by default. You can control when it runs using the dependency array: an empty array means it runs once on mount, and specific dependencies mean it runs only when those values change. The cleanup function returned from useEffect runs before the next effect and on unmount, preventing memory leaks.

useContext provides access to React's Context API without wrapper components. Instead of passing props through many levels of the component tree (prop drilling), you create a context, provide a value at a high level, and consume it anywhere below using useContext. This is commonly used for themes, authentication state, and language preferences.

Custom hooks are functions that start with 'use' and can call other hooks. They are the primary mechanism for reusing stateful logic between components. For example, a useAuth hook might combine useState, useEffect, and useContext to provide login status and user data. A useFetch hook might handle loading states, error handling, and data fetching in a reusable way.

There are strict rules for hooks. They must be called at the top level of a component or custom hook — never inside conditions, loops, or nested functions. This is because React relies on the order of hook calls to match state with the correct hook. The eslint-plugin-react-hooks package enforces these rules automatically. Breaking these rules leads to bugs where state gets mixed up between different hooks.

Other built-in hooks include useRef (persisting values across renders without triggering re-renders), useMemo (memoizing expensive calculations), useCallback (memoizing functions to prevent unnecessary child re-renders), and useReducer (managing complex state with a reducer pattern similar to Redux). React 18 added useTransition and useDeferredValue for concurrent rendering features.`
    },
    {
        title: "Node.js Event Loop",
        content: `Node.js is a JavaScript runtime built on Chrome's V8 engine that uses an event-driven, non-blocking I/O model. The event loop is the core mechanism that enables Node.js to handle thousands of concurrent connections with a single thread, making it highly efficient for I/O-heavy applications like web servers, APIs, and real-time applications.

The event loop has six phases that execute in order: timers, pending callbacks, idle/prepare, poll, check, and close callbacks. The timers phase executes callbacks from setTimeout and setInterval whose threshold has elapsed. The poll phase retrieves new I/O events and executes their callbacks. The check phase executes setImmediate callbacks. Understanding these phases helps debug timing issues in Node.js applications.

When Node.js starts, it initializes the event loop, processes the input script (which may make async API calls, schedule timers, or call process.nextTick), and then begins processing the event loop. Each iteration of the loop is called a tick. If there are no more callbacks to process and no pending I/O operations, Node.js exits.

Non-blocking I/O is what makes Node.js special. When you read a file or make a database query, Node.js does not wait for the operation to complete. Instead, it registers a callback and continues executing the next line of code. When the operation finishes, the callback is placed in the appropriate queue, and the event loop picks it up on the next tick. This is why Node.js can handle many requests simultaneously despite being single-threaded.

The call stack, callback queue, and microtask queue work together. Synchronous code runs on the call stack. When an async operation completes, its callback goes to the callback queue (macrotask queue). Promises and process.nextTick callbacks go to the microtask queue, which has higher priority — all microtasks are processed before the next macrotask. This is why a resolved Promise's then callback runs before a setTimeout with 0 delay.

Common pitfalls include blocking the event loop with CPU-intensive operations. If you run a heavy computation synchronously, no other requests can be processed until it finishes. Solutions include using Worker Threads for CPU-bound tasks, breaking computation into smaller chunks with setImmediate, or offloading work to separate processes. Understanding the event loop is essential for writing performant Node.js applications and is a frequent interview topic.`
    }
];