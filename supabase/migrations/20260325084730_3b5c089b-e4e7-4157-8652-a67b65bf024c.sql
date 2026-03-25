
-- Fix search_path on all security definer functions
CREATE OR REPLACE FUNCTION public.approve_withdrawal(p_withdrawal_id uuid, p_user_id uuid, p_amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE withdrawals SET status = 'approved' WHERE id = p_withdrawal_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal already processed'; END IF;
  IF (SELECT balance FROM profiles WHERE id = p_user_id) < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  UPDATE profiles SET balance = balance - p_amount WHERE id = p_user_id;
  INSERT INTO transactions (user_id, type, amount, description) VALUES (p_user_id, 'withdrawal', -p_amount, 'Withdrawal approved');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_adjust_balance(p_user_id uuid, p_amount numeric, p_description text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE profiles SET balance = COALESCE(balance, 0) + p_amount WHERE id = p_user_id;
  IF p_amount > 0 THEN UPDATE profiles SET total_earnings = COALESCE(total_earnings, 0) + p_amount WHERE id = p_user_id; END IF;
  INSERT INTO transactions (user_id, type, amount, description) VALUES (p_user_id, 'admin_adjustment', p_amount, COALESCE(p_description, 'Admin balance adjustment'));
END;
$$;

CREATE OR REPLACE FUNCTION public.start_investment(p_user_id uuid, p_plan_name text, p_amount numeric, p_duration_days integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF (SELECT balance FROM profiles WHERE id = p_user_id) < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  UPDATE profiles SET balance = balance - p_amount WHERE id = p_user_id;
  INSERT INTO investments (user_id, plan_name, amount, duration_days, status) VALUES (p_user_id, p_plan_name, p_amount, p_duration_days, 'active');
  INSERT INTO transactions (user_id, type, amount, description) VALUES (p_user_id, 'investment', -p_amount, 'Investment started: ' || p_plan_name);
END;
$$;

CREATE OR REPLACE FUNCTION public.end_investment(p_investment_id uuid, p_user_id uuid, p_credit_amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE investments SET status = 'completed' WHERE id = p_investment_id AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'Investment not active'; END IF;
  UPDATE profiles SET balance = COALESCE(balance, 0) + p_credit_amount, total_earnings = COALESCE(total_earnings, 0) + p_credit_amount WHERE id = p_user_id;
  INSERT INTO transactions (user_id, type, amount, description) VALUES (p_user_id, 'investment_return', p_credit_amount, 'Investment completed - credited');
END;
$$;
