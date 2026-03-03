export const programmingFAQs = [
  // JavaScript fundamentals
  {
    id: "faq-1",
    question: "What is a closure in JavaScript?",
    answer: "A closure is a function that retains access to variables from its outer (enclosing) scope even after the outer function has finished executing. This allows the inner function to 'remember' the environment in which it was created.",
    tags: ["javascript", "functions", "scope"],
  },
  {
    id: "faq-2",
    question: "What is the difference between let, const, and var?",
    answer: "var is function-scoped and hoisted. let and const are block-scoped. const prevents reassignment but doesn't make objects immutable. let allows reassignment. Prefer const by default, use let when you need to reassign.",
    tags: ["javascript", "variables"],
  },
  {
    id: "faq-3",
    question: "How does prototypal inheritance work in JavaScript?",
    answer: "Every JavaScript object has a prototype chain. When you access a property, JS looks up the chain until it finds it or reaches null. Objects inherit methods and properties from their prototype. Classes in JS are syntactic sugar over prototypal inheritance.",
    tags: ["javascript", "oop", "inheritance"],
  },
  {
    id: "faq-4",
    question: "What is the event loop in JavaScript?",
    answer: "The event loop is JavaScript's concurrency model. It continuously checks the call stack and task queues. When the stack is empty, it picks the next task from the microtask queue (Promises) first, then the macrotask queue (setTimeout, I/O). This is how JS handles async operations on a single thread.",
    tags: ["javascript", "async", "concurrency"],
  },
  {
    id: "faq-5",
    question: "What are Promises and how do they work?",
    answer: "A Promise represents a value that may be available now, later, or never. It has three states: pending, fulfilled, or rejected. You chain .then() for success and .catch() for errors. async/await is syntactic sugar over Promises that makes async code look synchronous.",
    tags: ["javascript", "async", "promises"],
  },
  {
    id: "faq-6",
    question: "What is the difference between == and === in JavaScript?",
    answer: "== performs type coercion before comparison (e.g., '5' == 5 is true). === checks both value and type without coercion (e.g., '5' === 5 is false). Always prefer === to avoid unexpected type coercion bugs.",
    tags: ["javascript", "operators"],
  },
  {
    id: "faq-7",
    question: "How does 'this' keyword work in JavaScript?",
    answer: "The value of 'this' depends on how a function is called: in a method, it's the object; in a regular function, it's window/undefined; arrow functions inherit 'this' from their enclosing scope; with call/apply/bind, you explicitly set it.",
    tags: ["javascript", "functions", "scope"],
  },
  {
    id: "faq-8",
    question: "What are higher-order functions?",
    answer: "Functions that take other functions as arguments or return functions. Examples: map, filter, reduce, forEach. They enable functional programming patterns like composition, currying, and callbacks.",
    tags: ["javascript", "functions", "functional-programming"],
  },
  {
    id: "faq-9",
    question: "How do you handle errors in JavaScript?",
    answer: "Use try-catch blocks for synchronous code. For Promises, use .catch() or try-catch with async/await. Create custom Error classes for different error types. Always handle errors at the appropriate level — don't swallow them silently.",
    tags: ["javascript", "error-handling"],
  },
  {
    id: "faq-10",
    question: "What is destructuring in JavaScript?",
    answer: "Destructuring extracts values from arrays or properties from objects into distinct variables. Array: const [a, b] = [1, 2]. Object: const { name, age } = person. Supports defaults, renaming, nested destructuring, and rest patterns.",
    tags: ["javascript", "es6", "syntax"],
  },

  // TypeScript
  {
    id: "faq-11",
    question: "What is TypeScript and why use it?",
    answer: "TypeScript is a typed superset of JavaScript that compiles to plain JS. It adds static type checking, interfaces, generics, and better IDE support. It catches bugs at compile time instead of runtime, making large codebases easier to maintain.",
    tags: ["typescript", "types"],
  },
  {
    id: "faq-12",
    question: "What is the difference between interface and type in TypeScript?",
    answer: "Both define shapes of data. Interfaces support declaration merging and extends. Types support unions, intersections, and mapped types. Use interfaces for object shapes and public APIs, types for unions and complex type transformations.",
    tags: ["typescript", "types"],
  },
  {
    id: "faq-13",
    question: "What are generics in TypeScript?",
    answer: "Generics let you write reusable code that works with multiple types while preserving type safety. Example: function identity<T>(arg: T): T returns the same type passed in. Used heavily in libraries, arrays, promises, and utility types.",
    tags: ["typescript", "generics"],
  },
  {
    id: "faq-14",
    question: "What is Zod and why use it with TypeScript?",
    answer: "Zod is a runtime validation library. TypeScript types are erased at compile time, so they can't validate data at runtime (like API responses or user input). Zod schemas validate at runtime AND infer TypeScript types, giving you both compile-time and runtime safety.",
    tags: ["typescript", "zod", "validation"],
  },

  // React
  {
    id: "faq-15",
    question: "What is the virtual DOM in React?",
    answer: "The virtual DOM is a lightweight in-memory representation of the real DOM. When state changes, React creates a new virtual DOM tree, diffs it against the previous one (reconciliation), and applies only the minimal necessary changes to the real DOM. This makes updates efficient.",
    tags: ["react", "dom", "performance"],
  },
  {
    id: "faq-16",
    question: "What are React hooks and why were they introduced?",
    answer: "Hooks let you use state and lifecycle features in functional components. useState for state, useEffect for side effects, useContext for context, useMemo/useCallback for optimization. They replaced class components, making code simpler and more reusable.",
    tags: ["react", "hooks"],
  },
  {
    id: "faq-17",
    question: "How does useEffect work in React?",
    answer: "useEffect runs side effects after render. With no dependency array, it runs after every render. With an empty array [], it runs once on mount. With dependencies [a, b], it runs when those values change. Return a cleanup function for subscriptions or timers.",
    tags: ["react", "hooks", "lifecycle"],
  },
  {
    id: "faq-18",
    question: "What is the difference between state and props in React?",
    answer: "Props are read-only data passed from parent to child. State is mutable data owned by the component. Props flow down (parent to child), state changes trigger re-renders. Use props for configuration, state for data that changes over time.",
    tags: ["react", "state", "props"],
  },
  {
    id: "faq-19",
    question: "How do you optimize React performance?",
    answer: "Use React.memo to prevent unnecessary re-renders, useMemo for expensive calculations, useCallback for stable function references. Virtualize long lists, lazy load components with React.lazy, split code with dynamic imports, use keys properly in lists.",
    tags: ["react", "performance", "optimization"],
  },

  // Node.js & Express
  {
    id: "faq-20",
    question: "What is Node.js and how is it different from browser JavaScript?",
    answer: "Node.js is a JavaScript runtime built on V8 that runs outside the browser. It provides filesystem access, networking, and OS-level APIs that browsers don't have. No DOM or window object. Uses CommonJS (require) or ES modules (import).",
    tags: ["nodejs", "runtime"],
  },
  {
    id: "faq-21",
    question: "What is Express.js middleware?",
    answer: "Middleware are functions that execute during the request-response cycle. They receive (req, res, next) and can modify the request/response, end the cycle, or call next() to pass control. Used for logging, auth, parsing, error handling, CORS.",
    tags: ["express", "middleware", "nodejs"],
  },
  {
    id: "faq-22",
    question: "How do you handle authentication in a Node.js API?",
    answer: "Common approaches: JWT (stateless, token in header), session-based (cookie + server-side store), OAuth (third-party login). JWTs are sent in Authorization header, verified with a secret. Use refresh tokens for long-lived sessions. Hash passwords with bcrypt.",
    tags: ["nodejs", "auth", "security"],
  },
  {
    id: "faq-23",
    question: "What is REST API design?",
    answer: "REST uses HTTP methods (GET, POST, PUT, DELETE) on resource URLs. GET /users returns users, POST /users creates one, GET /users/:id returns one. Use proper status codes (200, 201, 400, 404, 500). Return JSON. Keep it stateless.",
    tags: ["api", "rest", "design"],
  },
  {
    id: "faq-24",
    question: "How does streaming work in Node.js?",
    answer: "Streams process data in chunks without loading everything into memory. Four types: Readable (fs.createReadStream), Writable (fs.createWriteStream), Duplex (sockets), Transform (compression). Pipe streams together with .pipe(). Essential for large files and real-time data.",
    tags: ["nodejs", "streams", "performance"],
  },

  // Databases
  {
    id: "faq-25",
    question: "What is the difference between SQL and NoSQL databases?",
    answer: "SQL (PostgreSQL, MySQL) uses structured tables with schemas, supports JOIN operations and ACID transactions. NoSQL (MongoDB, Redis) uses flexible schemas — documents, key-value, graphs. SQL for complex relationships, NoSQL for flexible/fast-changing data.",
    tags: ["database", "sql", "nosql"],
  },
  {
    id: "faq-26",
    question: "What is database indexing and why is it important?",
    answer: "An index is a data structure that speeds up reads by creating a sorted reference to rows. Like a book's index — find topics without scanning every page. Without indexes, queries scan every row (O(n)). With indexes, lookups are O(log n). Trade-off: faster reads but slower writes.",
    tags: ["database", "performance", "indexing"],
  },
  {
    id: "faq-27",
    question: "What is MongoDB and when should you use it?",
    answer: "MongoDB is a document-oriented NoSQL database storing data as JSON-like BSON documents. Use it when: schema is flexible/evolving, you need horizontal scaling, data is hierarchical/nested, you don't need complex joins. Popular with Node.js apps via Mongoose.",
    tags: ["database", "mongodb", "nosql"],
  },
  {
    id: "faq-28",
    question: "What is Redis and what is it used for?",
    answer: "Redis is an in-memory key-value store. Used for caching (reduce DB load), session storage, rate limiting, pub/sub messaging, job queues (BullMQ), and real-time leaderboards. Extremely fast (microsecond reads) because data lives in RAM.",
    tags: ["database", "redis", "caching"],
  },

  // Git
  {
    id: "faq-29",
    question: "How does Git branching work?",
    answer: "A branch is a pointer to a commit. Creating a branch is cheap — it's just a new pointer. Main/master is the default branch. Feature branches isolate work. Merge combines branches. Rebase replays commits on top of another branch for a linear history.",
    tags: ["git", "version-control"],
  },
  {
    id: "faq-30",
    question: "What is the difference between merge and rebase in Git?",
    answer: "Merge creates a merge commit that combines two branches — preserves history but creates a non-linear graph. Rebase replays your commits on top of the target branch — creates linear history but rewrites commit hashes. Use merge for shared branches, rebase for local cleanup.",
    tags: ["git", "version-control"],
  },

  // CSS & Web
  {
    id: "faq-31",
    question: "What is CSS Flexbox and when do you use it?",
    answer: "Flexbox is a one-dimensional layout system for arranging items in rows or columns. Use justify-content for main axis alignment, align-items for cross axis. Perfect for navbars, card layouts, centering content. Use Grid for two-dimensional layouts.",
    tags: ["css", "layout", "flexbox"],
  },
  {
    id: "faq-32",
    question: "What is responsive web design?",
    answer: "Design that adapts to different screen sizes. Use media queries (@media), relative units (rem, %, vw), flexible grids (CSS Grid/Flexbox), and responsive images. Mobile-first approach: design for small screens first, then add complexity for larger screens.",
    tags: ["css", "responsive", "design"],
  },

  // Testing
  {
    id: "faq-33",
    question: "What are the different types of software testing?",
    answer: "Unit tests: test individual functions in isolation. Integration tests: test how components work together. End-to-end tests: test full user flows. The testing pyramid: many unit tests, fewer integration tests, fewest E2E tests. Tools: Jest, Vitest, Playwright, Cypress.",
    tags: ["testing", "quality"],
  },
  {
    id: "faq-34",
    question: "How do you write unit tests in JavaScript?",
    answer: "Use a test framework like Jest or Vitest. Write describe blocks for grouping, it/test for individual tests. Use expect() assertions: toBe, toEqual, toThrow. Mock external dependencies with jest.mock(). Aim for testing behavior, not implementation details.",
    tags: ["testing", "jest", "javascript"],
  },

  // Async & Concurrency
  {
    id: "faq-35",
    question: "What is async/await and how does it work?",
    answer: "async/await is syntactic sugar over Promises. An async function always returns a Promise. await pauses execution until the Promise resolves. Makes async code look synchronous and easier to read. Use try-catch for error handling instead of .catch().",
    tags: ["javascript", "async", "promises"],
  },
  {
    id: "faq-36",
    question: "What is the difference between concurrency and parallelism?",
    answer: "Concurrency is handling multiple tasks by switching between them (one CPU core, interleaved execution). Parallelism is executing multiple tasks simultaneously (multiple CPU cores). JavaScript is concurrent (event loop) but not parallel (single-threaded, unless using Workers).",
    tags: ["programming", "concurrency"],
  },

  // Security
  {
    id: "faq-37",
    question: "What is XSS and how do you prevent it?",
    answer: "Cross-Site Scripting (XSS) injects malicious scripts into web pages. Prevent with: escaping user input before rendering, Content Security Policy headers, using frameworks that auto-escape (React's JSX), sanitizing HTML input with libraries like DOMPurify.",
    tags: ["security", "xss", "web"],
  },
  {
    id: "faq-38",
    question: "What is CORS and why does it exist?",
    answer: "Cross-Origin Resource Sharing controls which domains can access your API. Browsers block cross-origin requests by default (Same-Origin Policy). CORS headers (Access-Control-Allow-Origin) whitelist allowed origins. Prevents malicious sites from making authenticated requests to your API.",
    tags: ["security", "cors", "web"],
  },

  // AI & LLMs
  {
    id: "faq-39",
    question: "What are LLMs and how do they work?",
    answer: "Large Language Models are neural networks trained on massive text data to predict the next token. They learn patterns, grammar, facts, and reasoning. You interact via prompts. They generate text token by token. Key concepts: context window, temperature, tokens, system/user messages.",
    tags: ["ai", "llm", "ml"],
  },
  {
    id: "faq-40",
    question: "What is prompt engineering?",
    answer: "The practice of crafting effective instructions for LLMs. Techniques: few-shot (examples in prompt), chain-of-thought (step-by-step reasoning), persona (role assignment), structured output (JSON format instructions). Better prompts = better results without changing the model.",
    tags: ["ai", "prompt-engineering"],
  },
  {
    id: "faq-41",
    question: "What are embeddings in AI?",
    answer: "Embeddings are dense numerical vectors that capture semantic meaning of text. Similar meanings produce similar vectors. Used for semantic search, recommendations, clustering, and RAG. Generated by embedding models like text-embedding-004. Compared using cosine similarity.",
    tags: ["ai", "embeddings", "vectors"],
  },
  {
    id: "faq-42",
    question: "What is RAG (Retrieval-Augmented Generation)?",
    answer: "RAG combines retrieval with generation: embed a query, search a vector database for relevant documents, inject retrieved chunks into the LLM prompt, generate a grounded answer. Reduces hallucination because the LLM answers from your data, not just its training data.",
    tags: ["ai", "rag", "search"],
  },
  {
    id: "faq-43",
    question: "What is streaming in the context of LLMs?",
    answer: "LLM streaming sends tokens to the client as they're generated, instead of waiting for the complete response. Uses Server-Sent Events (SSE). The client reads chunks via ReadableStream. Reduces perceived latency — users see text appearing progressively.",
    tags: ["ai", "streaming", "sse"],
  },
  {
    id: "faq-44",
    question: "How do you handle conversation memory with LLMs?",
    answer: "LLMs are stateless — they don't remember previous messages. You must send conversation history with each request. Strategies: full history (expensive), sliding window (last N messages), summary memory (summarize old messages and cache). Trade-off between context quality and token cost.",
    tags: ["ai", "memory", "chat"],
  },

  // Data Structures & Algorithms
  {
    id: "faq-45",
    question: "What is Big O notation?",
    answer: "Big O describes how an algorithm's time or space grows with input size. O(1) = constant, O(log n) = logarithmic, O(n) = linear, O(n log n) = linearithmic, O(n²) = quadratic. Used to compare algorithm efficiency. Focus on worst-case growth rate, not exact counts.",
    tags: ["dsa", "algorithms", "complexity"],
  },
  {
    id: "faq-46",
    question: "When should you use a hash map vs an array?",
    answer: "Arrays: ordered data, index-based access O(1), search O(n). Hash maps (objects/Map): key-value pairs, lookup by key O(1), unordered. Use arrays for ordered collections and iteration. Use hash maps when you need fast lookups by a key, counting, or deduplication.",
    tags: ["dsa", "data-structures"],
  },

  // DevOps & Deployment
  {
    id: "faq-47",
    question: "What is Docker and why use containers?",
    answer: "Docker packages applications with their dependencies into containers — lightweight, portable environments that run consistently everywhere. Solves 'works on my machine' problems. Containers share the host OS kernel (unlike VMs). Use Docker Compose for multi-container setups.",
    tags: ["devops", "docker", "deployment"],
  },
  {
    id: "faq-48",
    question: "What is CI/CD?",
    answer: "Continuous Integration: automatically build and test code on every push. Continuous Deployment: automatically deploy passing builds to production. Tools: GitHub Actions, Jenkins, GitLab CI. Catches bugs early, ensures consistent deployments, reduces manual errors.",
    tags: ["devops", "cicd", "automation"],
  },

  // System Design
  {
    id: "faq-49",
    question: "What is caching and what strategies exist?",
    answer: "Caching stores frequently accessed data in fast storage (RAM) to reduce load on slower storage (DB/API). Strategies: cache-aside (app checks cache first), write-through (write to cache and DB), TTL-based expiration. Tools: Redis, Memcached. Trade-off: speed vs data freshness.",
    tags: ["system-design", "caching", "performance"],
  },
  {
    id: "faq-50",
    question: "What is WebSocket and how is it different from HTTP?",
    answer: "WebSocket provides full-duplex, persistent connections between client and server. Unlike HTTP (request-response), WebSocket keeps the connection open for real-time bidirectional communication. Used for chat apps, live notifications, multiplayer games. Socket.IO is a popular library.",
    tags: ["networking", "websocket", "real-time"],
  },
];
