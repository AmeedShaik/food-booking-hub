import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, menuItemsTable } from "@workspace/db";
import {
  CreateMenuItemBody,
  UpdateMenuItemBody,
  UpdateMenuItemParams,
  GetMenuItemParams,
  DeleteMenuItemParams,
  ListMenuItemsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatMenuItem(m: typeof menuItemsTable.$inferSelect) {
  return {
    id: m.id,
    name: m.name,
    description: m.description ?? null,
    pricePaise: m.pricePaise,
    category: m.category,
    imageUrl: m.imageUrl ?? null,
    available: m.available,
    sortOrder: m.sortOrder,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

router.get("/menu-items", async (req, res) => {
  const query = ListMenuItemsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const items = await db
    .select()
    .from(menuItemsTable)
    .orderBy(asc(menuItemsTable.sortOrder), asc(menuItemsTable.name));

  let filtered = items;
  if (query.data.availableOnly) {
    filtered = filtered.filter((m) => m.available);
  }
  if (query.data.category) {
    const cat = query.data.category;
    filtered = filtered.filter((m) => m.category === cat);
  }

  res.json(filtered.map(formatMenuItem));
});

router.post("/menu-items", async (req, res) => {
  const body = CreateMenuItemBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid menu item data" });
    return;
  }

  const [item] = await db
    .insert(menuItemsTable)
    .values({
      name: body.data.name,
      description: body.data.description ?? null,
      pricePaise: body.data.pricePaise,
      category: body.data.category,
      imageUrl: body.data.imageUrl ?? null,
      available: body.data.available ?? true,
      sortOrder: body.data.sortOrder ?? 0,
    })
    .returning();

  res.status(201).json(formatMenuItem(item));
});

router.get("/menu-items/:id", async (req, res) => {
  const params = GetMenuItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [item] = await db
    .select()
    .from(menuItemsTable)
    .where(eq(menuItemsTable.id, params.data.id));

  if (!item) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }

  res.json(formatMenuItem(item));
});

router.patch("/menu-items/:id", async (req, res) => {
  const params = UpdateMenuItemParams.safeParse(req.params);
  const body = UpdateMenuItemBody.safeParse(req.body);

  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid data" });
    return;
  }

  // Only set fields that were provided
  const update: Partial<typeof menuItemsTable.$inferInsert> & { updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (body.data.name !== undefined) update.name = body.data.name;
  if (body.data.description !== undefined) update.description = body.data.description;
  if (body.data.pricePaise !== undefined) update.pricePaise = body.data.pricePaise;
  if (body.data.category !== undefined) update.category = body.data.category;
  if (body.data.imageUrl !== undefined) update.imageUrl = body.data.imageUrl;
  if (body.data.available !== undefined) update.available = body.data.available;
  if (body.data.sortOrder !== undefined) update.sortOrder = body.data.sortOrder;

  const [updated] = await db
    .update(menuItemsTable)
    .set(update)
    .where(eq(menuItemsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }

  res.json(formatMenuItem(updated));
});

router.delete("/menu-items/:id", async (req, res) => {
  const params = DeleteMenuItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(menuItemsTable)
    .where(eq(menuItemsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }

  res.status(204).send();
});

export default router;
