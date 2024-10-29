// spec.ts
import { test, expect, request } from "@playwright/test";
import { v4 as uuidv4 } from "uuid";
import {
  randomAlphaNumeric,
  randomHexColor,
  validateErrorResponse,
  createApiRequestContext,
  createTagData,
} from "./helper"; // Import your helpers
import { projectVariables } from "./credentials";

let eventTypes: string[] = [];

test.describe("API Test Suite", () => {
  let authToken;
  let apiRequestContext;
  let createdTag;
  let eventTypes; // Declare a variable to hold event types

  test.beforeAll(async () => {
    // Initialize API request context and fetch token
    const contextResult = await createApiRequestContext(
      projectVariables.client_id,
      projectVariables.client_secret
    );
    apiRequestContext = contextResult.apiRequestContext;
    authToken = contextResult.authToken;

    // Fetch event types
    const eventTypeResponse = await apiRequestContext.get(
      `https://api.mdev.ops.center/work-items/v1/tenants/${projectVariables.tenants_id}/tags/examples/event-types`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      }
    );

    if (eventTypeResponse.ok()) {
      eventTypes = await eventTypeResponse.json(); // Store the fetched event types
      console.log("Event Types Retrieved:", eventTypes);
    } else {
      throw new Error(
        "Failed to fetch event types: " + (await eventTypeResponse.text())
      );
    }
  });

  test("Create new Tag", async () => {
    const response = await apiRequestContext.post(
      `https://api.mdev.ops.center/work-items/v1/tenants/${projectVariables.tenants_id}/tags`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
        data: createTagData(), // Use the helper to create tag data
      }
    );

    // Validate response
    expect(response.status()).toBe(201);
    createdTag = await response.json();
    console.log("Created Tag Data:", createdTag);
    if (createdTag.latestEventHash) {
      createdTag.latestEventHash = createdTag.latestEventHash; // Capture the dynamic value
    } else {
      console.warn("No latestEventHash found in the created tag response.");
    }
  });

  test("Update Tag Event", async () => {
    if (!authToken) {
      throw new Error(
        "Authorization token is undefined. Please check the token retrieval process."
      );
    }

    // Ensure the tag was created before attempting to update it
    if (!createdTag) {
      throw new Error("No tag was created in the previous test.");
    }

    const randomIndex = Math.floor(Math.random() * eventTypes.length);
    const eventType = eventTypes[randomIndex];
    const previousEventHash = createdTag.latestEventHash;
    const latestEventId = uuidv4(); // Replace with your actual latest event ID
    const authorId = "your_author_id"; // Replace with your actual author ID
    const timeOfFactOffset = new Date().toISOString(); // Use the current timestamp

    const response = await apiRequestContext.put(
      `https://api.mdev.ops.center/work-items/v1/tenants/${projectVariables.tenants_id}/tags/${createdTag.id}/event`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: {
          type: eventType, // Use the fetched event type
          eventData: JSON.stringify({
            Color: createdTag.color,
            PreviousEventHash: previousEventHash,
            EventId: latestEventId,
            AuthorId: authorId,
            TimeOfFactOffset: timeOfFactOffset,
          }),
        },
      }
    );

    // Validate response
    expect(response.status()).toBe(200); // Adjust expected status code if necessary
    const updatedTagResponse = await response.json();
    console.log("Updated Tag Response:", updatedTagResponse);
  });

  test("Create new Tag - Missing ID", async () => {
    if (!authToken) {
      throw new Error(
        "Authorization token is undefined. Please check the token retrieval process."
      );
    }

    const response = await apiRequestContext.post(
      `https://api.mdev.ops.center/work-items/v1/tenants/${projectVariables.tenants_id}/tags`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
        data: {
          // ID is intentionally missing
          title: randomAlphaNumeric(),
          color: randomHexColor(),
          image: "http://placeimg.com/640/480/abstract",
          description: randomAlphaNumeric(),
          eventId: uuidv4(),
          timeOfFactOffset: new Date().toISOString(),
        },
      }
    );

    // Validate response for missing ID
    expect(response.status()).toBe(400);
    const responseBody = await response.json();
    console.log("Error Response for Missing ID:", responseBody);

    // Check validation errors
    expect(responseBody.errors.Id).toEqual("'Id' must not be empty.");
    validateErrorResponse(responseBody);
  });

  test("Create new Tag - Missing Title", async () => {
    if (!authToken) {
      throw new Error(
        "Authorization token is undefined. Please check the token retrieval process."
      );
    }

    const response = await apiRequestContext.post(
      `https://api.mdev.ops.center/work-items/v1/tenants/${projectVariables.tenants_id}/tags`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
        data: {
          id: uuidv4(),
          // Title is intentionally missing
          color: randomHexColor(),
          image: "http://placeimg.com/640/480/abstract",
          description: randomAlphaNumeric(),
          eventId: uuidv4(),
          timeOfFactOffset: new Date().toISOString(),
        },
      }
    );

    // Validate response for missing Title
    expect(response.status()).toBe(400);
    const responseBody = await response.json();
    console.log("Error Response for Missing Title:", responseBody);

    // Check validation errors
    expect(responseBody.errors.Title).toEqual("The Title field is required.");
    expect(responseBody.errors.Title).toEqual("'Title' must not be empty.");
    validateErrorResponse(responseBody);
  });
});
