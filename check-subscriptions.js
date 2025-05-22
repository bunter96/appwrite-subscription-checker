const sdk = require("node-appwrite");

(async () => {
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const database = new sdk.Databases(client);
  const dbId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_COLLECTION_ID;

  const now = new Date();
  console.log("🕒 Subscription check started at", now.toISOString());

  let totalChecked = 0;
  let totalDowngraded = 0;
  let totalErrors = 0;

  try {
    const users = await database.listDocuments(dbId, collectionId);
    console.log(`🔎 Found ${users.documents.length} users to check`);

    for (const user of users.documents) {
      totalChecked++;

      const expiryDate = new Date(user.current_plan_expiry_date);
      const isExpired = expiryDate < now;
      const isActive = user.is_active;

      console.log(`\n📄 User ${user.$id}`);
      console.log(`   ├─ Expiry Date: ${expiryDate.toISOString()}`);
      console.log(`   ├─ Now:         ${now.toISOString()}`);
      console.log(`   ├─ is_active:   ${isActive}`);
      console.log(`   └─ Expired:     ${isExpired}`);

      if (isExpired && isActive) {
        try {
          await database.updateDocument(dbId, collectionId, user.$id, {
            is_active: false,
          });
          totalDowngraded++;
          console.log(`   ✅ Marked as inactive.`);
        } catch (err) {
          totalErrors++;
          console.error(`   ❌ Failed to update user ${user.$id}: ${err.message}`);
        }
      } else {
        console.log(`   ✅ No action needed.`);
      }
    }
  } catch (err) {
    console.error("❌ Failed to fetch user documents:", err.message);
    process.exit(1);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   👥 Checked:   ${totalChecked}`);
  console.log(`   🔻 Inactivated: ${totalDowngraded}`);
  console.log(`   ❗ Errors:     ${totalErrors}`);
})();
