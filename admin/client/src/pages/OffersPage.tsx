import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { BadgePercent, CalendarClock, CheckCircle2, CirclePause, Gift, Plus, Save, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type DiscountType = "percentage" | "fixed" | "bogo" | "free_item";
type AppliesTo = "order" | "category" | "menu_item";
type OfferStatus = "draft" | "scheduled" | "active" | "paused" | "expired";

type OfferForm = {
  id?: number;
  title: string;
  displayLabel: string;
  description: string;
  terms: string;
  promoCode: string;
  discountType: DiscountType;
  discountValue: string;
  minimumOrder: string;
  maximumDiscount: string;
  appliesTo: AppliesTo;
  menuItemId: string;
  categoryId: string;
  status: OfferStatus;
  startsAt: string;
  endsAt: string;
  isFeatured: boolean;
};

const emptyForm = (): OfferForm => ({
  title: "",
  displayLabel: "",
  description: "",
  terms: "",
  promoCode: "",
  discountType: "percentage",
  discountValue: "10",
  minimumOrder: "0",
  maximumDiscount: "",
  appliesTo: "order",
  menuItemId: "",
  categoryId: "",
  status: "draft",
  startsAt: "",
  endsAt: "",
  isFeatured: false,
});

const rupees = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
const datetimeInput = (date: Date | null) => date ? new Date(date).toISOString().slice(0, 16) : "";
const statusStyles: Record<OfferStatus, string> = { active: "bg-primary text-primary-foreground", scheduled: "bg-amber-100 text-amber-950", draft: "bg-muted text-muted-foreground", paused: "bg-secondary text-secondary-foreground", expired: "bg-destructive text-destructive-foreground" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label className="pizjo-label text-[10px]">{label}</Label>{children}</div>;
}

function formFromOffer(offer: NonNullable<ReturnType<typeof useOfferList>["data"]>[number]): OfferForm {
  return {
    id: offer.id,
    title: offer.title,
    displayLabel: offer.displayLabel,
    description: offer.description || "",
    terms: offer.terms || "",
    promoCode: offer.promoCode || "",
    discountType: offer.discountType,
    discountValue: offer.discountType === "percentage" ? String(offer.discountValue / 100) : String(offer.discountValue / 100),
    minimumOrder: String(offer.minimumOrderPaise / 100),
    maximumDiscount: offer.maximumDiscountPaise ? String(offer.maximumDiscountPaise / 100) : "",
    appliesTo: offer.appliesTo,
    menuItemId: offer.menuItemId ? String(offer.menuItemId) : "",
    categoryId: offer.categoryId ? String(offer.categoryId) : "",
    status: offer.status,
    startsAt: datetimeInput(offer.startsAt),
    endsAt: datetimeInput(offer.endsAt),
    isFeatured: offer.isFeatured,
  };
}

function useOfferList() { return trpc.admin.offers.list.useQuery(); }

export default function OffersPage() {
  const offers = useOfferList();
  const menu = trpc.admin.catalog.list.useQuery();
  const categories = trpc.admin.catalog.categories.useQuery();
  const [statusFilter, setStatusFilter] = useState<OfferStatus | "all">("all");
  const [form, setForm] = useState<OfferForm>(emptyForm);
  const utils = trpc.useUtils();
  const save = trpc.admin.offers.save.useMutation({
    onSuccess: () => { utils.admin.offers.list.invalidate(); toast.success(form.id ? "Offer campaign updated" : "Offer campaign created"); setForm(emptyForm()); },
    onError: error => toast.error(error.message),
  });

  const filtered = useMemo(() => offers.data?.filter(offer => statusFilter === "all" || offer.status === statusFilter) ?? [], [offers.data, statusFilter]);
  const liveCount = offers.data?.filter(offer => offer.status === "active").length ?? 0;
  const scheduledCount = offers.data?.filter(offer => offer.status === "scheduled").length ?? 0;
  const featuredCount = offers.data?.filter(offer => offer.isFeatured).length ?? 0;
  const update = <Key extends keyof OfferForm>(key: Key, value: OfferForm[Key]) => setForm(current => ({ ...current, [key]: value }));
  const needsValue = form.discountType === "percentage" || form.discountType === "fixed";

  const submit = () => {
    const discountValue = form.discountType === "percentage" ? Math.round(Number(form.discountValue || 0) * 100) : form.discountType === "fixed" ? Math.round(Number(form.discountValue || 0) * 100) : 0;
    save.mutate({
      id: form.id,
      title: form.title.trim(),
      displayLabel: form.displayLabel.trim(),
      description: form.description.trim() || null,
      terms: form.terms.trim() || null,
      promoCode: form.promoCode.trim() || null,
      discountType: form.discountType,
      discountValue,
      minimumOrderPaise: Math.round(Number(form.minimumOrder || 0) * 100),
      maximumDiscountPaise: form.maximumDiscount ? Math.round(Number(form.maximumDiscount) * 100) : null,
      appliesTo: form.appliesTo,
      menuItemId: form.appliesTo === "menu_item" ? Number(form.menuItemId) : null,
      categoryId: form.appliesTo === "category" ? Number(form.categoryId) : null,
      status: form.status,
      startsAt: form.startsAt ? new Date(form.startsAt) : null,
      endsAt: form.endsAt ? new Date(form.endsAt) : null,
      isFeatured: form.isFeatured,
    });
  };

  return <div className="space-y-6">
    <header className="border-b-2 border-border pb-6">
      <p className="pizjo-label text-xs text-primary">Promotion control</p>
      <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><h1 className="text-3xl sm:text-4xl">Offers & deals</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Create customer-facing promotions with clear eligibility, scheduling, pause controls, and safe storefront display information.</p></div>
        <Button onClick={() => setForm(emptyForm())}><Plus className="mr-2 h-4 w-4" />New offer</Button>
      </div>
    </header>

    <div className="grid gap-4 md:grid-cols-3">
      <Metric icon={BadgePercent} label="Live offers" value={liveCount} note="Currently eligible to display" />
      <Metric icon={CalendarClock} label="Scheduled" value={scheduledCount} note="Waiting for their date window" />
      <Metric icon={Gift} label="Featured" value={featuredCount} note="Marked for storefront emphasis" />
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <Card><CardHeader className="border-b-2 border-border"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-xl">Campaign board</CardTitle><CardDescription className="mt-2">Review, pause, or edit every promotion without changing checkout totals directly.</CardDescription></div><Select value={statusFilter} onValueChange={value => setStatusFilter(value as OfferStatus | "all")}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All campaigns</SelectItem>{(["draft", "scheduled", "active", "paused", "expired"] as OfferStatus[]).map(status => <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>)}</SelectContent></Select></div></CardHeader><CardContent className="p-0">{offers.isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading campaigns…</p> : filtered.length ? <div className="divide-y-2 divide-border">{filtered.map(offer => <button className="flex w-full flex-col gap-3 p-5 text-left transition-colors hover:bg-primary/15 sm:flex-row sm:items-start sm:justify-between" key={offer.id} onClick={() => setForm(formFromOffer(offer))}><div><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{offer.title}</p><Badge className={`border-2 border-border capitalize ${statusStyles[offer.status]}`}>{offer.status}</Badge>{offer.isFeatured ? <Badge variant="outline" className="border-2 border-border">Featured</Badge> : null}</div><p className="mt-2 text-sm text-muted-foreground">{offer.displayLabel}{offer.promoCode ? ` · Code: ${offer.promoCode}` : ""}</p><p className="mt-2 text-xs text-muted-foreground">{offer.startsAt ? `Starts ${new Date(offer.startsAt).toLocaleString("en-IN")}` : "Starts immediately"}{offer.endsAt ? ` · Ends ${new Date(offer.endsAt).toLocaleString("en-IN")}` : ""}</p></div><div className="shrink-0 text-left sm:text-right"><p className="pizjo-marker text-xl">{offer.discountType === "percentage" ? `${offer.discountValue / 100}% OFF` : offer.discountType === "fixed" ? `${rupees(offer.discountValue)} OFF` : offer.discountType === "bogo" ? "BOGO" : "FREE ITEM"}</p><p className="mt-1 text-xs text-muted-foreground">{offer.minimumOrderPaise ? `On orders from ${rupees(offer.minimumOrderPaise)}` : "No minimum order"}</p></div></button>)}</div> : <div className="p-8 text-center"><Tag className="mx-auto h-8 w-8 text-primary" /><p className="mt-4 font-bold">No offers in this view</p><p className="mt-2 text-sm text-muted-foreground">Create a campaign, then activate it when it is ready for your storefront.</p></div>}</CardContent></Card>

      <Card className="self-start"><CardHeader className="border-b-2 border-border"><CardTitle className="text-xl">{form.id ? "Edit campaign" : "Build a new campaign"}</CardTitle><CardDescription className="mt-2">Only active campaigns within their optional date window appear in the secure storefront feed.</CardDescription></CardHeader><CardContent className="space-y-4 pt-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Campaign title"><Input value={form.title} onChange={event => update("title", event.target.value)} placeholder="Weekend pizza deal" /></Field><Field label="Storefront label"><Input value={form.displayLabel} onChange={event => update("displayLabel", event.target.value)} placeholder="WEEKEND SPECIAL" /></Field></div><Field label="Short description"><Textarea value={form.description} onChange={event => update("description", event.target.value)} placeholder="What customers see on the offer section" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Offer type"><Select value={form.discountType} onValueChange={value => update("discountType", value as DiscountType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage off</SelectItem><SelectItem value="fixed">Fixed ₹ off</SelectItem><SelectItem value="bogo">Buy one, get one</SelectItem><SelectItem value="free_item">Free item</SelectItem></SelectContent></Select></Field><Field label={form.discountType === "percentage" ? "Discount (%)" : form.discountType === "fixed" ? "Discount (₹)" : "Discount value"}><Input type="number" min="0" disabled={!needsValue} value={needsValue ? form.discountValue : "0"} onChange={event => update("discountValue", event.target.value)} /></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Minimum order (₹)"><Input type="number" min="0" value={form.minimumOrder} onChange={event => update("minimumOrder", event.target.value)} /></Field><Field label="Maximum discount (₹)"><Input type="number" min="0" value={form.maximumDiscount} onChange={event => update("maximumDiscount", event.target.value)} placeholder="Optional" /></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Applies to"><Select value={form.appliesTo} onValueChange={value => update("appliesTo", value as AppliesTo)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="order">Entire order</SelectItem><SelectItem value="category">Menu category</SelectItem><SelectItem value="menu_item">Specific menu item</SelectItem></SelectContent></Select></Field>{form.appliesTo === "category" ? <Field label="Category"><Select value={form.categoryId} onValueChange={value => update("categoryId", value)}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.data?.map(category => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectContent></Select></Field> : form.appliesTo === "menu_item" ? <Field label="Menu item"><Select value={form.menuItemId} onValueChange={value => update("menuItemId", value)}><SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger><SelectContent>{menu.data?.map(item => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select></Field> : <Field label="Promo code"><Input value={form.promoCode} onChange={event => update("promoCode", event.target.value)} placeholder="Optional" /></Field>}</div><div className="grid gap-4 sm:grid-cols-2"><Field label="Campaign state"><Select value={form.status} onValueChange={value => update("status", value as OfferStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["draft", "scheduled", "active", "paused", "expired"] as OfferStatus[]).map(status => <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>)}</SelectContent></Select></Field><Field label="Promo code"><Input value={form.promoCode} onChange={event => update("promoCode", event.target.value)} placeholder="Optional customer code" /></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Starts at"><Input type="datetime-local" value={form.startsAt} onChange={event => update("startsAt", event.target.value)} /></Field><Field label="Ends at"><Input type="datetime-local" value={form.endsAt} onChange={event => update("endsAt", event.target.value)} /></Field></div><Field label="Terms"><Textarea value={form.terms} onChange={event => update("terms", event.target.value)} placeholder="Offer conditions shown to customers" /></Field><label className="flex cursor-pointer items-center gap-3 border-2 border-border p-3"><Checkbox checked={form.isFeatured} onCheckedChange={checked => update("isFeatured", checked === true)} /><span className="text-sm font-medium">Feature this campaign on the storefront</span></label><div className="flex flex-wrap gap-3"><Button disabled={!form.title.trim() || !form.displayLabel.trim() || save.isPending || (form.appliesTo === "category" && !form.categoryId) || (form.appliesTo === "menu_item" && !form.menuItemId)} onClick={submit}><Save className="mr-2 h-4 w-4" />{form.id ? "Save campaign" : "Create campaign"}</Button>{form.id ? <Button variant="outline" onClick={() => setForm(emptyForm())}>Cancel edit</Button> : null}</div></CardContent></Card>
    </div>
  </div>;
}

function Metric({ icon: Icon, label, value, note }: { icon: typeof CheckCircle2; label: string; value: number; note: string }) {
  return <Card><CardContent className="flex items-start justify-between gap-3 p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-black">{value}</p><p className="mt-2 text-xs text-muted-foreground">{note}</p></div><div className="border-2 border-border bg-primary p-2 text-primary-foreground"><Icon className="h-5 w-5" /></div></CardContent></Card>;
}
