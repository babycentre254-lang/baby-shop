import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ROLES } from "@baby-shop/shared";
import { ObjectIdPipe } from "../../common/pipes/object-id.pipe";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AdminService } from "./admin.service";
import { adminSaleSchema, analyticsRangeSchema, createBranchSchema, draftOrderSchema, listAdminQuerySchema, staffSchema, storeSettingsSchema, updateBranchSchema, updateStaffAccessSchema } from "./admin.schemas";
import { Permissions } from "../../common/decorators/permissions.decorator";

@ApiTags("admin")
@Controller("admin")
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("analytics")
  @Permissions("dashboard.view")
  @ApiOperation({ summary: "Admin dashboard analytics" })
  analytics(@Query("days", new ZodValidationPipe(analyticsRangeSchema)) days: number) { return this.admin.analytics(days); }

  @Get("customers")
  @Permissions("customers.view")
  @ApiOperation({ summary: "List customers" })
  customers(@Query(new ZodValidationPipe(listAdminQuerySchema)) query: any) { return this.admin.listCustomers(query); }

  @Get("customers/:id")
  @Permissions("customers.view")
  customer(@Param("id", ObjectIdPipe) id: string) { return this.admin.getCustomerDetails(id); }

  @Get("staff")
  @Roles(ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: "List staff members" })
  staff(@Query(new ZodValidationPipe(listAdminQuerySchema)) query: any) { return this.admin.listStaff(query); }

  @Post("staff")
  @Roles(ROLES.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  createStaff(@Body(new ZodValidationPipe(staffSchema)) body: any) { return this.admin.createStaff(body).then((user) => ({ user })); }

  @Patch("staff/:id/access")
  @Roles(ROLES.SUPER_ADMIN)
  updateStaffAccess(@CurrentUser("sub") actorId: string, @Param("id", ObjectIdPipe) id: string, @Body(new ZodValidationPipe(updateStaffAccessSchema)) body: any) {
    return this.admin.updateStaffAccess(id, actorId, body).then((user) => ({ user }));
  }

  @Get("branches")
  @Permissions("branches.view")
  branches() { return this.admin.listBranches().then((branches) => ({ branches })); }
  @Post("branches")
  @Permissions("branches.manage")
  @HttpCode(HttpStatus.CREATED)
  createBranch(@Body(new ZodValidationPipe(createBranchSchema)) body: any) { return this.admin.createBranch(body).then((branch) => ({ branch })); }
  @Patch("branches/:id")
  @Permissions("branches.manage")
  updateBranch(@Param("id", ObjectIdPipe) id: string, @Body(new ZodValidationPipe(updateBranchSchema)) body: any) { return this.admin.updateBranch(id, body).then((branch) => ({ branch })); }
  @Delete("branches/:id")
  @Permissions("branches.manage")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeBranch(@Param("id", ObjectIdPipe) id: string) { return this.admin.removeBranch(id); }

  @Get("settings")
  @Permissions("settings.view")
  settings() { return this.admin.getSettings().then((settings) => ({ settings })); }
  @Patch("settings")
  @Permissions("settings.manage")
  updateSettings(@Body(new ZodValidationPipe(storeSettingsSchema)) body: any) { return this.admin.updateSettings(body).then((settings) => ({ settings })); }

  @Get("draft-orders")
  @Permissions("draft-orders.view")
  drafts(@Query(new ZodValidationPipe(listAdminQuerySchema)) query: any) { return this.admin.listDrafts(query); }
  @Post("draft-orders")
  @Permissions("draft-orders.manage")
  @HttpCode(HttpStatus.CREATED)
  createDraft(@CurrentUser("sub") userId: string, @Body(new ZodValidationPipe(draftOrderSchema)) body: any) { return this.admin.createDraft(body, userId).then((draft) => ({ draft })); }
  @Patch("draft-orders/:id")
  @Permissions("draft-orders.manage")
  updateDraft(@Param("id", ObjectIdPipe) id: string, @Body(new ZodValidationPipe(draftOrderSchema)) body: any) { return this.admin.updateDraft(id, body).then((draft) => ({ draft })); }
  @Delete("draft-orders/:id")
  @Permissions("draft-orders.manage")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeDraft(@Param("id", ObjectIdPipe) id: string) { return this.admin.removeDraft(id); }

  @Get("pos/products")
  @Permissions("orders.manage")
  posProducts(@Query(new ZodValidationPipe(listAdminQuerySchema)) query: any) { return this.admin.posProducts(query.search ?? ""); }
  @Post("orders/pos")
  @Permissions("orders.manage")
  @HttpCode(HttpStatus.CREATED)
  createPosSale(@CurrentUser("sub") userId: string, @Body(new ZodValidationPipe(adminSaleSchema)) body: any) { return this.admin.createPosSale(body, userId); }
}

