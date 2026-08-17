import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Synced from Clerk on first sign-in (see convex/users.ts)
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),

  // A single generated notebook, tied to one paper. This is the "chat"/session
  // unit the user revisits from their dashboard.
  sessions: defineTable({
    userId: v.string(), // clerkId
    title: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("ready"),
      v.literal("failed"),
    ),
    errorMessage: v.optional(v.string()),

    // Denormalized paper info so we don't need a join for the common case.
    paperSourceId: v.string(),
    paperSource: v.union(
      v.literal("arxiv"),
      v.literal("semanticScholar"),
      v.literal("upload"),
    ),
    paperTitle: v.string(),
    paperAuthors: v.array(v.string()),
    paperAbstract: v.string(),
    paperExternalUrl: v.optional(v.string()),
    paperPdfUrl: v.optional(v.string()),
    generationStartedAt: v.optional(v.number()),
    retryCount: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_status", ["status"]),

  // Ordered notebook cells belonging to a session.
  notebookBlocks: defineTable({
    sessionId: v.id("sessions"),
    order: v.number(),
    type: v.union(v.literal("markdown"), v.literal("code")),
    title: v.optional(v.string()),
    content: v.string(),
    editedByUser: v.optional(v.boolean()),
    regenerating: v.optional(v.boolean()),
  }).index("by_session", ["sessionId"]),

  // Cache of recent search queries -> results, to avoid hammering free APIs.
  searchCache: defineTable({
    query: v.string(),
    resultsJson: v.string(),
    createdAt: v.number(),
  }).index("by_query", ["query"]),

  // Chunks of paper text with embeddings, for RAG-based notebook chat.
  paperFiles: defineTable({
    sessionId: v.id("sessions"),
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.optional(v.string()),
  }).index("by_session", ["sessionId"]),

  paperChunks: defineTable({
    sessionId: v.id("sessions"),
    fileId: v.optional(v.id("paperFiles")),
    chunkIndex: v.number(),
    text: v.string(),
    embedding: v.array(v.float64()),
  })
    .index("by_session", ["sessionId"])
    .index("by_file", ["fileId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 768,
      filterFields: ["sessionId"],
    }),

  // Chat thread for the notebook chat panel, one per session.
  chatMessages: defineTable({
    sessionId: v.id("sessions"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_session", ["sessionId"]),
});
