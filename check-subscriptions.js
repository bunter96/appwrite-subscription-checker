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
      const startDate = new Date(user.current_plan_start_date);
      const expiryDate = new Date(startDate);
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      const isExpired = expiryDate < now;
      const isPremium = user.is_premium_user;

      console.log(`\n📄 User ${user.$id}`);
      console.log(`   ├─ Start:   ${startDate.toISOString()}`);
      console.log(`   ├─ Expiry:  ${expiryDate.toISOString()}`);
      console.log(`   ├─ Premium: ${isPremium}`);
      console.log(`   └─ Expired: ${isExpired}`);

      if (isExpired && isPremium) {
        try {
          await database.updateDocument(dbId, collectionId, user.$id, {
            is_premium_user: false,
          });
          totalDowngraded++;
          console.log(`   ✅ Premium removed.`);
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
  console.log(`   🔻 Downgraded: ${totalDowngraded}`);
  console.log(`   ❗ Errors:     ${totalErrors}`);
})();
