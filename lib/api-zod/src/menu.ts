/**
 * Hand-written zod validators for menu-item endpoints.
 *
 * NOTE: These match the OpenAPI spec at lib/api-spec/openapi.yaml. Once
 * `pnpm --filter @workspace/api-spec generate` is run, orval will produce
 * equivalent validators in ./generated/api.ts and this file can be removed.
 */
import * as zod from "zod";

/**
 * @summary List all menu items
 */
export const ListMenuItemsQueryParams = zod.object({
  availableOnly: zod.coerce.boolean().optional(),
  category: zod.string().optional(),
});

const MenuItemShape = {
  id: zod.number(),
  name: zod.string(),
  description: zod.string().nullish(),
  pricePaise: zod.number().int().min(0),
  category: zod.string(),
  imageUrl: zod.string().nullish(),
  available: zod.boolean(),
  sortOrder: zod.number().int().min(0),
  createdAt: zod.coerce.date(),
  updatedAt: zod.coerce.date(),
};

export const ListMenuItemsResponseItem = zod.object(MenuItemShape);
export const ListMenuItemsResponse = zod.array(ListMenuItemsResponseItem);

/**
 * @summary Create a new menu item
 */
export const CreateMenuItemBody = zod.object({
  name: zod.string().min(1),
  description: zod.string().optional(),
  pricePaise: zod.number().int().min(0),
  category: zod.string().min(1),
  imageUrl: zod.string().optional(),
  available: zod.boolean().optional(),
  sortOrder: zod.number().int().min(0).optional(),
});

export const CreateMenuItemResponse = zod.object(MenuItemShape);

/**
 * @summary Get a menu item by ID
 */
export const GetMenuItemParams = zod.object({
  id: zod.coerce.number(),
});

export const GetMenuItemResponse = zod.object(MenuItemShape);

/**
 * @summary Update a menu item
 */
export const UpdateMenuItemParams = zod.object({
  id: zod.coerce.number(),
});

export const UpdateMenuItemBody = zod.object({
  name: zod.string().min(1).optional(),
  description: zod.string().nullish(),
  pricePaise: zod.number().int().min(0).optional(),
  category: zod.string().min(1).optional(),
  imageUrl: zod.string().nullish(),
  available: zod.boolean().optional(),
  sortOrder: zod.number().int().min(0).optional(),
});

export const UpdateMenuItemResponse = zod.object(MenuItemShape);

/**
 * @summary Delete a menu item
 */
export const DeleteMenuItemParams = zod.object({
  id: zod.coerce.number(),
});
