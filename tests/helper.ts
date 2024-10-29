// helper.ts
import { expect, request } from "@playwright/test";
import { v4 as uuidv4 } from "uuid";

// Function to create a new API request context
export const createApiRequestContext = async (
  clientId: string,
  clientSecret: string
) => {
  const apiRequestContext = await request.newContext();
  const tokenResponse = await apiRequestContext.post(
    "https://login.genetec.com/connect/token",
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "*/*",
      },
      data: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }
  );

  if (tokenResponse.ok()) {
    const responseBody = await tokenResponse.json();
    return { apiRequestContext, authToken: responseBody.access_token };
  } else {
    throw new Error("Failed to fetch token: " + (await tokenResponse.text()));
  }
};

// Function to generate a random UUID
export const randomUUID = () => uuidv4();

// Function to generate random alphanumeric string
export const randomAlphaNumeric = (length = 10) => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
};

// Function to generate random hex color
export const randomHexColor = () => {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
};

// Function to create a tag data payload
export const createTagData = (customOverrides = {}) => {
  return {
    id: randomUUID(),
    title: randomAlphaNumeric(),
    color: randomHexColor(),
    image: "http://placeimg.com/640/480/abstract",
    description: randomAlphaNumeric(),
    eventId: randomUUID(),
    timeOfFactOffset: new Date().toISOString(),
    ...customOverrides, // Apply any overrides provided
  };
};

export const validateErrorResponse = (responseBody) => {
  expect(responseBody.title).toEqual("One or more validation errors occurred.");
  expect(responseBody.detail).toEqual(
    "Please refer to the errors property for additional details."
  );
};
