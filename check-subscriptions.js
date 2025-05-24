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
    console.log(`🔍 Found ${users.documents.length} user(s)`);

    for (const user of users.documents) {
      totalChecked++;

      const expiry = user.current_plan_expiry_date
        ? new Date(user.current_plan_expiry_date)
        : null;
      const isExpired = expiry && expiry < now;
      const isActive = user.is_active;

      console.log(`\n📄 User: ${user.$id}`);
      console.log(`   ├─ Expiry Date: ${expiry ? expiry.toISOString() : "null"}`);
      console.log(`   ├─ is_active: ${isActive}`);
      console.log(`   └─ Expired: ${isExpired}`);

      if (isExpired && isActive) {
        try {
          await database.updateDocument(dbId, collectionId, user.$id, {
            is_active: false,
            current_active_plan: null,
            char_allowed: null,
            char_remaining: null,
            current_plan_start_date: null,
            current_plan_expiry_date: null,
            active_product_id: null,
            billing_cycle: null,
            plan_type: null,
            creem_customer_id: null,
            creem_subscription_id: null,
          });

          console.log(`   ✅ User downgraded and fields reset.`);
          totalDowngraded++;
        } catch (err) {
          console.error(`   ❌ Failed to downgrade user ${user.$id}:`, err.message);
          totalErrors++;
        }
      } else {
        console.log(`   ✅ No action needed.`);
      }
    }
  } catch (err) {
    console.error("❌ Failed to fetch users:", err.message);
    process.exit(1);
  }

  console.log(`\n📊 Done. Checked: ${totalChecked}, Downgraded: ${totalDowngraded}, Errors: ${totalErrors}`);
})();
