#!/usr/bin/env python3
"""Симуляция боя по правилам «Корни судьбы»"""
import random
random.seed(42)

def roll2d6():
    return random.randint(1, 6) + random.randint(1, 6)

# === ПЕРСОНАЖИ 3 УРОВНЯ ===
# +2 ранга за 2 левел-апа, типичное снаряжение
pcs = {
    'Варлор': {'Тело': 4, 'Ловкость': 2, 'Рукопашная': 3, 'оружие': 2, 'доспех': 2, 'ранги': 10, 'тип': 'рукоп'},
    'Сильвана': {'Тело': 2, 'Ловкость': 4, 'Стрельба': 3, 'оружие': 2, 'доспех': 1, 'ранги': 8, 'тип': 'лук'},
    'Морвен': {'Тело': 3, 'Ловкость': 3, 'Рукопашная': 3, 'оружие': 2, 'доспех': 2, 'ранги': 9, 'тип': 'рукоп'},
}
for name, s in pcs.items():
    s['ЧЦ'] = 8 + s['Ловкость'] + s['доспех']

# === ВРАГИ ===
# Бандит: аналог ополченца (нет в бестиарии) — Тело 2, Ловк 2, Раны 5, кожа +1, Кинжал +1
# Наёмник, Культист — из приключения «Стеклянный звон»
enemies = {}
for i in range(4):
    enemies[f'Бандит{i+1}'] = {'Тело': 2, 'Ловкость': 2, 'ранги': 5, 'оружие': 1, 'доспех': 1, 'навык': 1}
for i in range(2):
    enemies[f'Наёмник{i+1}'] = {'Тело': 3, 'Ловкость': 2, 'ранги': 6, 'оружие': 1, 'доспех': 1, 'навык': 1}
enemies['Культист'] = {'Тело': 3, 'Ловкость': 2, 'ранги': 8, 'оружие': 1, 'доспех': 0, 'навык': 1}
for name, e in enemies.items():
    e['ЧЦ'] = 8 + e['Ловкость'] + e['доспех']

# === ИНИЦИАТИВА ===
init = []
for name in pcs:
    init.append((roll2d6() + pcs[name]['Ловкость'], name, 'pc'))
for name in enemies:
    init.append((roll2d6() + enemies[name]['Ловкость'], name, 'enemy'))
init.sort(key=lambda x: -x[0])

def attack(attacker, target, attacker_stats, target_stats, is_ranged=False):
    """Атака: итог = 2d6 + атрибут + ранг (без бонуса оружия). Урон = (итог − ЧЦ) + бонус оружия."""
    if is_ranged:
        mod = attacker_stats['Ловкость'] + attacker_stats.get('Стрельба', 0)
    else:
        attr = max(attacker_stats['Тело'], attacker_stats['Ловкость'])
        skill = attacker_stats.get('Рукопашная', attacker_stats.get('навык', 0))
        mod = attr + skill
    weapon_bonus = attacker_stats['оружие']
    roll = roll2d6()
    total = roll + mod  # итог атаки (бонус оружия только в уроне)
    chc = target_stats['ЧЦ']
    if total >= chc:
        dmg = max(1, (total - chc) + weapon_bonus)
        return True, dmg, roll, mod, weapon_bonus, total, chc
    return False, 0, roll, mod, weapon_bonus, total, chc

# Симуляция
pc_list = list(pcs.keys())
enemy_list = list(enemies.keys())

print("=" * 60)
print("СИМУЛЯЦИЯ БОЯ: 3 персонажа 3 ур. vs 4 бандита + 2 наёмника + 1 культист")
print("=" * 60)
print()
print("ИНИЦИАТИВА (2d6 + Ловкость):")
for r, name, side in init:
    s = "PC" if side == "pc" else "Враг"
    print(f"  {name}: {r} ({s})")
print()

round_num = 0
while pc_list and enemy_list:
    round_num += 1
    print(f"--- РАУНД {round_num} ---")
    
    for _, name, side in init:
        if side == 'pc' and name not in pc_list:
            continue
        if side == 'enemy' and name not in enemy_list:
            continue
        if not enemy_list or not pc_list:
            break
            
        stats = pcs[name] if side == 'pc' else enemies[name]
        is_ranged = (name == 'Сильвана' and side == 'pc')
        
        for action in range(2):  # 2 ОД за раунд — 2 атаки
            if not enemy_list or not pc_list:
                break
            target_name = enemy_list[0] if side == 'pc' else pc_list[0]
            target_stats = enemies[target_name] if side == 'pc' else pcs[target_name]
            
            hit, dmg, roll, mod, w_bonus, total, chc = attack(name, target_name, stats, target_stats, is_ranged)
            
            # Лог: действие | атака (2d6+мод) | защита (ЧЦ) | результат | урон
            act = "Атака (лук)" if is_ranged else "Атака (рукопашная)"
            atk_str = f"2d6({roll}) + {mod} = {total}"
            def_str = f"ЧЦ {chc}"
            if hit:
                dmg_formula = f"({total} − {chc}) + {w_bonus} = {dmg}"
                print(f"  {name} бьёт {target_name}")
                print(f"    Действие: {act}")
                print(f"    Атака: {atk_str}")
                print(f"    Защита: {def_str}")
                print(f"    {total} ≥ {chc} → попадание")
                print(f"    Урон: {dmg_formula} → {dmg} ран")
                target_stats['ранги'] -= dmg
                if target_stats['ранги'] <= 0:
                    if side == 'pc':
                        enemy_list.remove(target_name)
                        print(f"    → {target_name} выбит")
                    else:
                        pc_list.remove(target_name)
                        print(f"    → {target_name} выбит")
            else:
                print(f"  {name} бьёт {target_name}")
                print(f"    Действие: {act}")
                print(f"    Атака: {atk_str}")
                print(f"    Защита: {def_str}")
                print(f"    {total} < {chc} → промах")
            print()
    print()

print("=" * 60)
if pc_list:
    print("ПОБЕДА ИГРОКОВ!")
    for p in pc_list:
        print(f"  {p}: осталось {pcs[p]['ранги']} ран")
else:
    print("ПОБЕДА ВРАГОВ!")
    for e in enemy_list:
        print(f"  {e}: осталось {enemies[e]['ранги']} ран")
print("=" * 60)
