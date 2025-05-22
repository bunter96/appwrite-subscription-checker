const sdk = require("node-appwrite");

(async () => {
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const database = new sdk.Databases(client);
  const dbId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = "user_profiles";

  const now = new Date();

  try {
    const users = await database.listDocuments(dbId, collectionId);

    for (const user of users.documents) {
      const start = new Date(user.current_plan_start_date);
      const expiry = new Date(start);
      expiry.setMonth(expiry.getMonth() + 1); // Monthly plan

      if (expiry < now && user.is_premium_user) {
        await database.updateDocument(dbId, collectionId, user.$id, {
          is_premium_user: false,
        });

        console.log(`Updated user ${user.$id}`);
      }
    }
  } catch (err) {
    console.error("Failed to check subscriptions:", err.message);
  }
})();
