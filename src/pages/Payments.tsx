import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { 
  DollarSign, 
  Plus, 
  CreditCard, 
  Smartphone,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Banknote,
  Calendar,
  CalendarDays,
  CalendarRange,
  Copy,
  Check
} from "lucide-react";
import { type Payment, type User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const TRAINER_VENMO = "@ConstanzaBotti";
const TRAINER_ZELLE = "constanza.botti@email.com";

export default function PaymentsPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [copiedMethod, setCopiedMethod] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTrainer = profile?.role === "trainer";

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const copyToClipboard = async (text: string, method: string) => {
    const showCopied = () => {
      setCopiedMethod(method);
      toast({
        title: t('payments.copied'),
        description: t('payments.copySuccess'),
      });
      // Limpia cualquier timeout previo para que el estado se reinicie
      // exactamente 2s despues del ultimo clic (evita botones "trabados").
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedMethod(null);
        copyTimeoutRef.current = null;
      }, 2000);
    };

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showCopied();
      } else {
        // Fallback para webviews moviles (Instagram, Safari embebido, etc.)
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (ok) showCopied();
        else throw new Error("Copy command failed");
      }
    } catch (err) {
      toast({ title: t('app.error'), variant: "destructive" });
    }
  };

  const { data: paymentsList, isLoading } = useQuery<Payment[]>({
    queryKey: [api.payments.list.path],
  });

  const { data: students } = useQuery<User[]>({
    queryKey: [api.users.listStudents.path],
    enabled: isTrainer,
  });

  const [newPayment, setNewPayment] = useState({
    studentId: "",
    amount: "",
    description: "",
    periodType: "class" as "class" | "week" | "month",
  });

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", api.payments.create.path, {
        trainerId: user?.id,
        studentId: newPayment.studentId,
        amount: Math.round(parseFloat(newPayment.amount) * 100),
        currency: "usd",
        description: newPayment.description,
        periodType: newPayment.periodType,
        status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.payments.list.path] });
      setIsCreateOpen(false);
      setNewPayment({ studentId: "", amount: "", description: "", periodType: "class" });
      toast({ title: t('payments.createSuccess') });
    },
    onError: (error: any) => {
      toast({ title: t('app.error'), description: error.message, variant: "destructive" });
    },
  });

  const payMutation = useMutation({
    mutationFn: async ({ id, method }: { id: number; method: string }) => {
      return apiRequest("PATCH", `/api/payments/${id}`, {
        status: "paid",
        paymentMethod: method,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.payments.list.path] });
      setPaymentDialogOpen(false);
      setSelectedPayment(null);
      toast({ title: t('payments.paySuccess') });
    },
    onError: (error: any) => {
      toast({ title: t('app.error'), description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10"><Clock className="w-3 h-3 mr-1" /> {t('payments.pending')}</Badge>;
      case "paid":
        return <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10"><CheckCircle2 className="w-3 h-3 mr-1" /> {t('payments.paid')}</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="border-red-500/50 text-red-500 bg-red-500/10"><XCircle className="w-3 h-3 mr-1" /> {t('payments.cancelled')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPeriodBadge = (period: string | null) => {
    switch (period) {
      case "class":
        return <Badge variant="outline" className="text-xs"><Calendar className="w-3 h-3 mr-1" /> {t('payments.periods.class')}</Badge>;
      case "week":
        return <Badge variant="outline" className="text-xs"><CalendarDays className="w-3 h-3 mr-1" /> {t('payments.periods.week')}</Badge>;
      case "month":
        return <Badge variant="outline" className="text-xs"><CalendarRange className="w-3 h-3 mr-1" /> {t('payments.periods.month')}</Badge>;
      default:
        return null;
    }
  };

  const getPaymentMethodIcon = (method: string | null) => {
    switch (method) {
      case "card":
        return <CreditCard className="w-4 h-4" />;
      case "venmo":
        return <Smartphone className="w-4 h-4" />;
      case "zelle":
        return <Building2 className="w-4 h-4" />;
      case "cash":
        return <Banknote className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold neon-gradient-text">{t('payments.title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isTrainer ? t('payments.subtitleTrainer') : t('payments.subtitleStudent')}
          </p>
        </div>
        
        {isTrainer && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 neon-gradient text-black font-semibold" data-testid="button-new-payment">
                <Plus className="w-4 h-4" />
                {t('payments.newPayment')}
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border/50">
              <DialogHeader>
                <DialogTitle className="neon-gradient-text">{t('payments.createPayment')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>{t('payments.student')}</Label>
                  <Select value={newPayment.studentId} onValueChange={(v) => setNewPayment({ ...newPayment, studentId: v })}>
                    <SelectTrigger data-testid="select-student">
                      <SelectValue placeholder={t('payments.selectStudent')} />
                    </SelectTrigger>
                    <SelectContent>
                      {students?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.firstName || s.email} {s.lastName || ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('payments.period')}</Label>
                  <Select value={newPayment.periodType} onValueChange={(v) => setNewPayment({ ...newPayment, periodType: v as any })}>
                    <SelectTrigger data-testid="select-period">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="class">{t('payments.periods.class')}</SelectItem>
                      <SelectItem value="week">{t('payments.periods.week')}</SelectItem>
                      <SelectItem value="month">{t('payments.periods.month')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('payments.amount')}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-9"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                      data-testid="input-amount"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('payments.description')}</Label>
                  <Textarea
                    placeholder={t('payments.descriptionPlaceholder')}
                    value={newPayment.description}
                    onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                    data-testid="input-description"
                  />
                </div>

                <Button 
                  className="w-full neon-gradient text-black font-bold" 
                  onClick={() => createPaymentMutation.mutate()}
                  disabled={!newPayment.studentId || !newPayment.amount || !newPayment.description || createPaymentMutation.isPending}
                  data-testid="button-create-payment"
                >
                  {createPaymentMutation.isPending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                  {t('payments.newPayment')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isTrainer && (
        <Card className="glass-card neon-border">
          <CardContent className="pt-6">
            <h3 className="font-display font-bold text-lg mb-4 neon-gradient-text">{t('payments.availableMethods')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full neon-gradient flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-black" />
                </div>
                <span className="font-semibold text-sm">{t('payments.methods.card')}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-sm">{t('payments.methods.venmo')}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-sm">{t('payments.methods.zelle')}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-sm">{t('payments.methods.cash')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-display font-bold">{isTrainer ? t('payments.history') : t('payments.myPayments')}</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin w-8 h-8 text-primary" />
          </div>
        ) : paymentsList?.length === 0 ? (
          <Card className="glass-card border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>{isTrainer ? t('payments.noCharges') : t('payments.noPayments')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {paymentsList?.map((payment) => (
              <Card key={payment.id} className="glass-card hover:neon-border transition-all">
                <CardContent className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl neon-gradient flex items-center justify-center">
                      {getPaymentMethodIcon(payment.paymentMethod)}
                    </div>
                    <div>
                      <p className="font-bold">{payment.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.createdAt!).toLocaleDateString(undefined, { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </p>
                        {getPeriodBadge(payment.periodType)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-display font-bold text-primary">
                        ${(payment.amount / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">{payment.currency}</p>
                    </div>

                    {getStatusBadge(payment.status)}

                    {!isTrainer && payment.status === "pending" && (
                      <Dialog open={paymentDialogOpen && selectedPayment?.id === payment.id} onOpenChange={(open) => {
                        setPaymentDialogOpen(open);
                        if (!open) setSelectedPayment(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            className="neon-gradient text-black font-semibold"
                            onClick={() => setSelectedPayment(payment)}
                            data-testid={`button-pay-${payment.id}`}
                          >
                            {t('payments.payNow')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card">
                          <DialogHeader>
                            <DialogTitle className="neon-gradient-text">{t('payments.selectMethod')}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 pt-4">
                            <p className="text-center text-2xl font-display font-bold text-primary mb-6">
                              ${(payment.amount / 100).toFixed(2)} USD
                            </p>
                            
                            <Button 
                              variant="outline" 
                              className="w-full justify-start gap-3 h-14 hover:neon-border transition-all"
                              onClick={() => payMutation.mutate({ id: payment.id, method: "card" })}
                              disabled={payMutation.isPending}
                              data-testid="button-pay-card"
                            >
                              <div className="w-10 h-10 rounded-full neon-gradient flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-black" />
                              </div>
                              <span className="font-semibold">{t('payments.payWith')} {t('payments.methods.card')}</span>
                            </Button>
                            
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                className="flex-1 justify-start gap-3 h-14 hover:neon-border transition-all"
                                onClick={() => payMutation.mutate({ id: payment.id, method: "venmo" })}
                                disabled={payMutation.isPending}
                                data-testid="button-pay-venmo"
                              >
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                                  <Smartphone className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left">
                                  <span className="font-semibold block">{t('payments.methods.venmo')}</span>
                                  <span className="text-xs text-muted-foreground">{TRAINER_VENMO}</span>
                                </div>
                              </Button>
                              <Button 
                                size="lg"
                                variant="outline"
                                className={`relative h-14 px-6 rounded-2xl transition-all duration-300 font-bold tracking-wide border-2 ${
                                  copiedMethod === "venmo" 
                                    ? "bg-emerald-400 text-black border-emerald-400 scale-102 shadow-[0_0_25px_rgba(52,211,153,0.5)]" 
                                    : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-emerald-400/50 hover:bg-neutral-900"
                                }`}
                                onClick={() => copyToClipboard(TRAINER_VENMO, "venmo")}
                                data-testid="button-copy-venmo"
                              >
                                <div className="flex items-center gap-3">
                                  {copiedMethod === "venmo" ? (
                                    <>
                                      <Check className="w-5 h-5 text-black animate-in zoom-in duration-200 stroke-[3]" />
                                      <span className="text-sm font-extrabold uppercase tracking-wider animate-in fade-in duration-200">¡COPIADO!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-5 h-5 transition-transform group-hover:scale-105" />
                                      <span className="text-sm font-bold tracking-wide">COPIAR VENMO</span>
                                    </>
                                  )}
                                </div>
                                {copiedMethod === "venmo" && (
                                  <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-emerald-400 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-lg border border-emerald-500 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {t('payments.copied')}
                                  </span>
                                )}
                              </Button>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                className="flex-1 justify-start gap-3 h-14 hover:neon-border transition-all"
                                onClick={() => payMutation.mutate({ id: payment.id, method: "zelle" })}
                                disabled={payMutation.isPending}
                                data-testid="button-pay-zelle"
                              >
                                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                                  <Building2 className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left">
                                  <span className="font-semibold block">{t('payments.methods.zelle')}</span>
                                  <span className="text-xs text-muted-foreground">{TRAINER_ZELLE}</span>
                                </div>
                              </Button>
                              <Button 
                                size="lg"
                                variant="outline"
                                className={`relative h-14 px-6 rounded-2xl transition-all duration-300 font-bold tracking-wide border-2 ${
                                  copiedMethod === "zelle" 
                                    ? "bg-emerald-400 text-black border-emerald-400 scale-102 shadow-[0_0_25px_rgba(52,211,153,0.5)]" 
                                    : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-emerald-400/50 hover:bg-neutral-900"
                                }`}
                                onClick={() => copyToClipboard(TRAINER_ZELLE, "zelle")}
                                data-testid="button-copy-zelle"
                              >
                                <div className="flex items-center gap-3">
                                  {copiedMethod === "zelle" ? (
                                    <>
                                      <Check className="w-5 h-5 text-black animate-in zoom-in duration-200 stroke-[3]" />
                                      <span className="text-sm font-extrabold uppercase tracking-wider animate-in fade-in duration-200">¡COPIADO!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-5 h-5 transition-transform group-hover:scale-105" />
                                      <span className="text-sm font-bold tracking-wide">COPIAR ZELLE</span>
                                    </>
                                  )}
                                </div>
                                {copiedMethod === "zelle" && (
                                  <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-emerald-400 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-lg border border-emerald-500 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {t('payments.copied')}
                                  </span>
                                )}
                              </Button>
                            </div>

                            <Button 
                              variant="outline" 
                              className="w-full justify-start gap-3 h-14 hover:neon-border transition-all"
                              onClick={() => payMutation.mutate({ id: payment.id, method: "cash" })}
                              disabled={payMutation.isPending}
                              data-testid="button-pay-cash"
                            >
                              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                                <Banknote className="w-5 h-5 text-white" />
                              </div>
                              <span className="font-semibold">{t('payments.payWith')} {t('payments.methods.cash')}</span>
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <footer className="text-center text-xs text-muted-foreground pt-4 border-t border-border/30">
        {t('app.copyright')}
      </footer>
    </div>
  );
}
