(function () {
    // DOM helper
    function get (id) {
        var id1 = id.substr(1);
        switch (id.charAt(0)) {
            case '#':
                return document.getElementById(id1);
            case '.':
                return document.getElementsByClassName(id1)[0];
            default:
                return document.getElementsByTagName(id)[0];
        }
    }

    function gets (element, tag) {
        return element.getElementsByTagName(tag);
    }

    // JS helper
    function arr_del (arr, e) {
        var idx = arr.indexOf(e);
        if (idx > -1) {
            arr.splice(idx, 1);
        } else assert("arr_del idx == -1");
    }

    function arr_get (src, e, dest) {
        var idx = src.indexOf(e);
        if (idx > -1) {
            return dest[idx];
        } else assert("arr_get idx == -1");
        return null
    }

    function arr_contains (src, e) {
        var idx = src.indexOf(e);
        return (idx != -1);
    }

    function arr_empty (arr) {
        return arr.length == 0 ;
    }

    function arr_clone (src, dest) {
        dest.length = 0;
        for (var i in src) {
            dest.push (src[i]);
        }
    }

    function max (a, b) {
        if (a > b) {
            return a;
        } else {
            return b;
        }
    }

    function min (a, b) {
        if (a < b) {
            return a;
        } else {
            return b;
        }
    }

    // debug
    var debug_ = get("#debug");
    function debug (str) {
        debug_.innerHTML += ("\n" + str);
    }
    function clear_debug () {
        debug_.innerHTML = "";
    }

    var info_ = get("#info");
    function info (str) {
        if (game && !game.dont)
            info_.innerHTML += ("\n" + str);
    }
    function clear_info () {
        info_.innerHTML = "";
    }

    var assert_ = get("#assert");
    function assert(str, cond) {
        if (!cond) {
            assert_.innerHTML += ("\n" + str);
        }
    } 
    function clear_assert () {
        assert_.innerHTML = "";
    }

    var inits = [[0,1,0,1,0,1,0,1],
        [1,0,1,0,1,0,1,0],
        [0,1,0,1,0,1,0,1],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [-1,0,-1,0,-1,0,-1,0],
        [0,-1,0,-1,0,-1,0,-1],
        [-1,0,-1,0,-1,0,-1,0]];

    function Dice (p, is_human, is_king) {
        this.p = p;
        this.is_human = is_human;
        this.is_king = is_king;

        this.moves = [];
    }

    Dice.prototype.get_directions = function () {
        var nexts;
        if (this.is_king) {
            nexts = [this.p.lu, this.p.ru, this.p.lb, this.p.rb];
        } else if (this.is_human) {
            nexts = [this.p.lb, this.p.rb];
        } else {
            nexts = [this.p.lu, this.p.ru];
        }
        return nexts;
    }

    Dice.prototype.can_move = function (to_add) {
        var nexts = this.get_directions();
        return this.p.can_move (nexts, to_add); 
    }

    Dice.prototype.can_jump = function (to_add) {
        var nexts = this.get_directions();
        return this.p.can_jump (nexts, to_add);
    }

    Dice.prototype.clear_move = function () {
        this.moves.length = 0;
    }

    Dice.prototype.mark_path = function () {
        this.can_move(true);
        this.can_jump(true);

        for (var i in this.moves) {
            this.moves[i].mark_path();
        }
    }

    Dice.prototype.clear_path = function () {
        for (var i in this.moves) {
            this.moves[i].clear_path();
        }
        this.clear_move();
    }

    Dice.prototype.is_dest = function (p) {
        for (var i in this.moves) {
            if (this.moves[i].equals(p)) {
                return this.moves[i]; // a move or a jump   
            } 
        }
        return false;
    }

    Dice.prototype.moveto = function (mj, flag_jump) {
        if (flag_jump && !mj.exec) return false;
        game.store (this, mj);

        if (mj.exec) {
            info ("Jump: " + this.p.to_string() + " -> " + mj.to_string()); 
            mj.exec();
        } else {
            info ("Move: " + this.p.to_string() + " -> " + mj.to_string());
        }
        this.p.remove_dice();
        this.p = mj.dest;
        this.p.add_dice(this);
        return true;
    }

    Dice.prototype.revert_move = function (mj, is_king) {
        info ("Revert: " + this.p.to_string() + " -> " + mj.to_string());
        if (mj.revert) {
            mj.revert();
        }
        mj.dest.remove_dice();
        this.p.add_dice(this, is_king);
    }

    Dice.prototype.move = function (p, flag_jump) {
        var ret = this.is_dest(p);
        if (!ret) return false;

        var ret1 = this.moveto(ret, flag_jump); 
        if (ret1) {
            this.clear_path();
            return true;
        } else
            return false;
    }

    Dice.prototype.add_move = function (p) {
        this.moves.push(p);
    }

    Dice.prototype.add_jump = function (j) {
        this.moves.push(j);
    }

    function Move (p, v) {
        this.dest = p;
        this.v = v;
    }

    // NB: parm p is a Pair!!!
    Move.prototype.equals = function (p) {
        return this.dest && this.dest.equals(p);
    }

    Move.prototype.mark_path = function () {
        game.set_path (this.dest);
    }

    Move.prototype.clear_path = function () {
        game.clear_path (this.dest);
        this.dest = null;
        this.v = 0;
    }

    Move.prototype.to_string = function () {
        return this.dest.to_string() + "(" + this.get_score() +")";
    }

    // -1: captured
    // 1: not captured
    // 2: become king
    Move.prototype.get_score = function () {
        return this.v;
    }

    function Jump (j) {
        this.captures = [];
        this.stops = [];
        if (typeof j == "undefined") {
            this.dest = null;
            this.v = 0;
        } else {
            arr_clone (j.captures, this.captures);
            arr_clone (j.stops, this.stops);
            this.dest = j.dest;
            this.v = j.v;
        }
    }

    // NB: parm p is a Pair!!!
    Jump.prototype.equals = function (p) {
        return this.dest && this.dest.equals(p);
    }

    Jump.prototype.add_capture = function (p) {
        this.captures.push (p);
    }

    // NB: dest is the last stop
    Jump.prototype.add_stop = function (p, v) {
        game.set_visited(p);
        this.stops.push(p);
        this.dest = p;
        this.v = v;
    }

    Jump.prototype.mark_path = function (p) {
        for (var i in this.stops) {
            game.set_path (this.stops[i]);
        }
    }

    Jump.prototype.clear_path = function () {
        for (var i in this.stops) {
            game.clear_path(this.stops[i]);
        }
        this.captures.length = 0;
        this.stops.length = 0;
        this.dest = null;
        this.v = 0;
    }

    Jump.prototype.to_string = function () {
        var ret = this.dest.to_string() + "(" + this.get_score() +")" 
            + "\nthrough: ";
        for (var i in this.stops) {
            ret += this.stops[i].to_string();
        }
        ret += ";\ncapture: ";
        for (var i in this.captures) {
            ret += this.captures[i].to_string();
        }
        ret += ";"; 
        return ret;
    }

    Jump.prototype.store_captureds = function () {
        this.captureds = [];
        for (var i in this.captures) {
            this.captureds.push(this.captures[i].d);
        }
    }

    Jump.prototype.exec = function () {
        for (var i in this.captures) {
            game.remove_dice(this.captures[i].d);
            this.captures[i].remove_dice();
        }
        info (game.dice_stats());
    }

    Jump.prototype.revert = function () {
        for (var i in this.captures) {
            this.captures[i].add_dice(this.captureds[i]);
            game.add_dice(this.captureds[i]);
        }
        info (game.dice_stats());
    }

    // -1 + (n-1) : captured
    // 1 + (n-1) : not captured
    // 2 + (n-1) : become king
    Jump.prototype.get_score = function () {
        return this.v + (this.captures.length - 1); 
    }

    // NB: x is for tr and y is for td.
    function Pair (x, y, td, make_king) {
        this.x = x;
        this.y = y;
        this.td = td;
        this.make_king = make_king;

        this.d = null;
    }

    Pair.prototype.valid = function (x, y) {
        return (x > -1 && y > -1 && x < 8 && y < 8);
    }

    Pair.prototype.get_oppo_dir = function (f) {
        switch (f) {
            case this.lu:
                return this.rb;
            case this.ru:
                return this.lb;
            case this.lb:
                return this.ru;
            case this.rb:
                return this.lu;
            default:
                assert ("error dir!");
        }
    }
    // the next left-up one
    Pair.prototype.lu = function () {
        var x = this.x - 1, y = this.y -1;
        if (!this.valid(x, y)) return null;
        return game.get_pair(x, y);
    }

    // the next right-up one
    Pair.prototype.ru = function () {
        var x = this.x - 1, y = this.y + 1;
        if (!this.valid(x, y)) return null;
        return game.get_pair(x, y);
    }

    // the next left-bottom one
    Pair.prototype.lb = function () {
        var x = this.x + 1, y = this.y - 1;
        if (!this.valid(x, y)) return null;
        return game.get_pair(x, y);
    }

    // the next right-bottom one
    Pair.prototype.rb = function () {
        var x = this.x + 1, y = this.y + 1;
        if (!this.valid(x, y)) return null;
        return game.get_pair(x, y);
    }

    // can move one step ?
    Pair.prototype.can_move = function (nexts, to_add) {
        game.clear_visited ();
        var ret = false;
        for (var i in nexts) {
            var tmp = nexts[i].apply(this);
            if (tmp && game.is_blank(tmp)) {
                if (to_add) {
                    this.d.add_move (new Move(tmp, 
                                tmp.get_score(nexts, this.d)));
                    ret = true;
                } else return true;
            }
        }
        return ret;
    }

    // can jump as many as possible?
    Pair.prototype.can_jump = function (nexts, to_add) {
        var ret = false;
        for (var i in nexts) {
            var tmp = new Jump();
            if (this._can_jump(this.d, tmp, nexts[i], nexts, to_add)) {
                if (!to_add) 
                    return true;
            }
        }
        return ret;
    }

    // 1) look at two steps; 2) add the jump and continue exploring 
    Pair.prototype._can_jump = function (d, jump, next, nexts, to_add) {
        var tmp = next.apply(this);
        if (!tmp) return false;
        if (!game.is_opponent(tmp)) return false;
        var tmp1 = next.apply(tmp);
        if (!tmp1) return false;
        if (!game.is_blank(tmp1)) return false;

        if (to_add) {
            jump.add_capture(tmp);
            jump.add_stop(tmp1, tmp1.get_score(nexts, d));
            d.add_jump(new Jump(jump));
            for (var i in nexts) {
                tmp1._can_jump (d, jump, nexts[i], nexts, to_add);
            }
        } 
        return true;
    }

    Pair.prototype.get_score = function (nexts, d) {
        if (this.make_king && !d.is_king) return 2;
        for (var i in nexts) {
            var tmp = nexts[i].apply(this);
            if (tmp && game.is_opponent(tmp)) {
                // see whether this oppo can take me.
                var op1 = this.get_oppo_dir(nexts[i]);
                var d1 = tmp.d;
                var nexts1 = d1.get_directions();
                if (arr_contains(nexts1, op1)) {
                    var tmp1 = op1.apply(this);
                    if (tmp1 && game.is_blank(tmp1)) {
                        return -1;
                    }
                }
            }
        }
        return 1;
    }

    Pair.prototype.equals = function (other) {
        return (this.x == other.x && this.y == other.y);
    }

    Pair.prototype.to_string = function () {
        return "[" + this.x + ", " + this.y + "]";
    }

    Pair.prototype.add_dice = function (d, is_king) {
        if (typeof is_king != "undefined") d.is_king = is_king;
        else if (this.make_king) d.is_king = true;

        if (this.td) 
            this.td.className = game.get_class(d.is_king, d.is_human);
        this.d = d;
        game.board_add (this, game.get_val(this.d));
    }

    Pair.prototype.remove_dice = function () {
        if(this.td) this.td.className = "";
        this.d = null;
        game.board_del (this);
    }

    Pair.prototype.set_selected = function () {
        this.td.className = game.get_class_selected(this.d.is_king);
        this.d.mark_path();
    }


    Pair.prototype.clear_selected = function () {
        this.td.className = game.get_class(this.d.is_king);
        this.d.clear_path();
    }

    function Game (human_first, force_jump, one_player) {
        this.human = human_first;
        this.force_jump = force_jump;
        this.one_player = one_player;
        // store the table and pairs
        this.table = table;
        this.pairs = [];
        // store all the dices
        this.hdices = [];
        this.adices = [];
        // board
        this.board = [[0,1,0,1,0,1,0,1],
        [1,0,1,0,1,0,1,0],
        [0,1,0,1,0,1,0,1],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [-1,0,-1,0,-1,0,-1,0],
        [0,-1,0,-1,0,-1,0,-1],
        [-1,0,-1,0,-1,0,-1,0]];
        // 0: human, 1: computer
        this.stored = [];
    }

    Game.prototype.clear_table = function () {
        debug ("clear table");
        var trs = gets (this.table, "tr");
        for (i = 0; i < trs.length; i++) {
            tds = gets (trs[i], "td");
            for (j = 0; j < tds.length; j++) {
                tds[j].className = "";
            }
        }
    }

    Game.prototype.place_table = function () {
        debug ("place table");
        var trs = gets (this.table, "tr");
        var make_king = false;
        for (i = 0; i < trs.length; i++) {
            this.pairs[i] = [];
            tds = gets (trs[i], "td");

            if (i == 0 || i == trs.length - 1) make_king = true;
            else make_king = false;  

            for (j = 0; j < tds.length; j++) {
                var td = tds[j];    
                var p = new Pair(i, j, td);
                this.pairs[i][j] = p;
                td.onclick = (function (p) {
                    return function() { game.click (p);}
                })(p);
                if (inits[i][j] == 1) {
                    var d = new Dice (p, true, false);
                    p.add_dice(d);
                    this.hdices.push(d);
                } else if (inits[i][j] == -1) {
                    var d = new Dice (p, false, false);
                    p.add_dice(d);
                    this.adices.push(d);
                }
                p.make_king = make_king;
            }
        }
        debug ("place table Done! ");
    }

    { // selected/move functions
        Game.prototype.set_selected = function (p) {
            if (this.selected_pair) {
                this.clear_selected ();
            }
            this.selected_pair = p;
            this.selected_pair.set_selected();
        }

        Game.prototype.clear_selected = function () {
            this.selected_pair.clear_selected();
            delete this.selected_pair; 
        }

        Game.prototype.move_selected = function (p) {
            if (!this.selected_pair) return false;
            if (this.selected_pair.d.move (p, this.flag_jump)){
                delete this.selected_pair; 
                return true;
            }
            return false;
        }

        Game.prototype.set_path = function (p) {
            p.td.className = "path";
        }

        Game.prototype.clear_path = function (p) {
            if (p.td.className == "path")
                p.td.className = "";
        }

        Game.prototype.add_dice = function (d) {
            if (d.is_human) {
                this.hdices.push(d);
            } else {
                this.adices.push(d);
            } 
        }

        Game.prototype.remove_dice = function (d) {
            if (d.is_human) {
                arr_del (this.hdices, d);
            } else {
                arr_del (this.adices, d);
            } 
        }

        Game.prototype.dice_stats = function () {
            return "human: " + (this.hdices.length) + ", computer: " 
                + (this.adices.length);
        }

        Game.prototype.set_visited = function (p) {
            this.board[p.x][p.y] = 4;
        }

        Game.prototype.clear_visited = function () {
            for (var i in this.board) {
                var row = this.board[i];
                for (var j in row) {
                    if (row[j] == 4) row[j] = 0;
                }
            }
        }

        Game.prototype.board_stats = function () {
            var ret = "";
            for (var i in this.board) {
                var row = this.board[i];
                for (var j in row) {
                    ret += row[j] + ", ";
                }
                ret += "\n";
            }
            return ret;
        }

        Game.prototype.store = function (d, mj) {
            var tmp;
            if (mj.exec) {
                tmp = new Jump(mj);
                tmp.store_captureds();
            } else {
                tmp = new Move(mj.dest);
            }
            if (this.human)
                this.stored[0] = new Pair(d, d.p, tmp, d.is_king);
            else 
                this.stored[1] = new Pair(d, d.p, tmp, d.is_king);
        }

        Game.prototype.restore = function (ai_mode) {
            if (ai_mode) {
				if (this.human) {
					if (this.stored[0]) { 
						this._restore (this.stored[0]);    
						this.stored[0] = null;
						return true;
					}
				} else {
					if (this.stored[1]) {
						this._restore (this.stored[1]);    
						this.stored[1] = null;
						return true;
					} 
				}
            } else if (this.one_player) {
                if (this.stored[0] && this.stored[1]) {
                    this._restore (this.stored[1]);    
                    this.stored[1] = null;
                    this._restore (this.stored[0]);    
                    this.stored[0] = null;
                    return true;
                }  
            } else {
                if (this.human) {
                    if (this.stored[1]) { 
                        this._restore (this.stored[1]);    
                        this.stored[1] = null;
                        return true;
                    }
                } else {
                    if (this.stored[0]) { 
                        this._restore (this.stored[0]);    
                        this.stored[0] = null;
                        return true;
                    }
                }
            }
            info ("You have nothing to revert :<");
            return false;
        }

        Game.prototype._restore = function (stored) {
            var d = stored.x;
            d.p = stored.y;
            d.revert_move(stored.td, stored.make_king); 
        }
    }

    { // query functions
        Game.prototype.is_blank = function (p) {
            return this.board[p.x][p.y] == 0;
        }

        Game.prototype.is_path = function (p) {
            return (p.td.className == "path");
        }

        Game.prototype.is_self = function (p) {
            var tmp = this.board[p.x][p.y];
            return this.human ? (tmp ==1 || tmp == 2) 
                : tmp < 0;
        }

        Game.prototype.is_self_selected = function (p) {
            return this.selected_pair && this.selected_pair.equals(p);
        }

        Game.prototype.is_opponent = function (p) {
            var tmp = this.board[p.x][p.y];
            return this.human ? tmp < 0 :(tmp ==1 || tmp == 2);
        }

        Game.prototype.get_pair = function (x, y) {
            return this.pairs[x][y];
        }

        // NB: is_human is only passed in when place_table
        Game.prototype.get_class = function (is_king, is_human) {
            if (typeof is_human == "undefined") {
                is_human = this.human;
            }
            if (is_king)
                return is_human?"player1k":"ai1k";
            else 
                return is_human?"player1":"ai1";
        }

        Game.prototype.get_class_selected = function (is_king) {
            if (is_king)
                return this.human?"player2k":"ai2k";
            else
                return this.human?"player2":"ai2";
        }
    } 

    {// TODO: minimax search and alpha-beta prune 
        Game.prototype.board_del = function (p) {
            this.board[p.x][p.y] = 0;
        }

        Game.prototype.board_add = function (p, v) {
            this.board[p.x][p.y] = v;
        }

        Game.prototype.get_val = function (d) {
            if (d.is_king) {
                if (d.is_human) return 2;
                else return -2;
            } else {
                if (d.is_human) return 1;
                else return -1;
            }
        }

        Game.prototype.clone_pairs = function (src, dest) {
            for (i = 0; i < 8; i++) {
                dest[i] = [];
                for (j = 0; j < 8; j++) {
                    dest[i][j] = new Pair(i,j, null, src[i][j].make_king);
                }
            } 
        }

        Game.prototype.clone_dices = function (src, dest, pairs) {
            for (var i in src) {
                var d = src[i];
                var p = pairs[d.p.x][d.p.y];
                var d1 = new Dice(p, d.is_human, d.is_king);
                p.d = d1;
                dest.push (d1);
            }
        }

        Game.prototype.clone_board = function (src, dest) {
            for (var i in src) {
                dest[i] = [];
                for (var j in src[i]) {
                    dest[i][j] = src[i][j];
                }
            }
        }

        // clone hdices, adices, and board, force_jump, human
        Game.prototype.clone_for_ai = function () {
            var ai_game = new Game(this.human, this.force_jump);
            ai_game.dont = this.dont; // propagate
            //ai_game.pairs = this.pairs; // sharing pairs does not matter
            this.clone_pairs (this.pairs, ai_game.pairs);
            this.clone_dices (this.hdices, ai_game.hdices, ai_game.pairs);
            this.clone_dices (this.adices, ai_game.adices, ai_game.pairs);
            this.clone_board (this.board, ai_game.board);
            return ai_game;
        }

        Game.prototype.cur_dices = function () {
            var dices = null;
            if (this.human) {
                dices = this.hdices;
            }  else {
                dices = this.adices;
            }
            return dices;
        }

        Game.prototype.op_dices = function () {
            var dices = null;
            if (this.human) {
                dices = this.adices;
            }  else {
                dices = this.hdices;
            }
            return dices;
        }

        // Evaluation function.
        var ws = [[0,4,0,4,0,4,0,4],
                  [4,0,3,0,3,0,3,0],
                  [0,3,0,2,0,2,0,4],
                  [4,0,2,0,1,0,3,0],
                  [0,3,0,1,0,2,0,4],
                  [4,0,2,0,2,0,3,0],
                  [0,3,0,3,0,3,0,4],
                  [4,0,4,0,4,0,4,0]];

        Game.prototype.get_score = function (is_max) {
            var dices = this.cur_dices();
            var sum = 0;
            for (var i in dices) {
                var d = dices[i];
                var p = d.p;
                sum += ws[p.x][p.y];
            }
            dices = this.op_dices();
            for (var i in dices) {
                var d = dices[i];
                var p = d.p;
                sum -= ws[p.x][p.y];
            }
            return sum;
        }

        Game.prototype.get_score1 = function (is_max) {
            if (this.winner == "player1") {
                return Number.NEGATIVE_INFINITY;
            } else if (this.winner == "player2") {
                return Number.POSITIVE_INFINITY; 
            }

            var dices = this.cur_dices();
            var sum = 0;
            for (var i in dices) {
                var d = dices[i];
                d.can_move(true);
                d.can_jump(true);
                for (var j in dices[i].moves) {
                    var mj = d.moves[j];
                    if (this.flag_jump && !this.exec) continue;
                    sum += mj.get_score();
                }
            }
            if (is_max) return sum;
            else return -sum;
        }

        Game.prototype.get_score2 = function (is_max) {
            if (this.winner == "player1") {
                return -1;
            } else if (this.winner == "player2") {
                return 1; 
            }
            var dices = this.cur_dices();
            var sum = 0;
            for (var i in dices) {
                var d = dices[i];
                var p = d.p;
                d.can_move(true);
                d.can_jump(true);
                for (var j in dices[i].moves) {
                    var mj = d.moves[j];
                    if (this.flag_jump && !this.exec) continue;
                    sum += mj.get_score();
                }
            }
            if (is_max) return (this.adices.length 
                    - (this.hdices.length - sum));
            else return (this.hdices.length 
                    - (this.adices.length - sum));
        }

        // It may be better to have Dice/Pair have a field game pointing to
        // which game they belong to.
        Game.prototype.alphabeta = function (depth, alpha, beta, is_max) {
            expanded_nodes++;
            if (depth == 0 || this.winner) {
                return this.get_score (is_max);
            }

            var dices = this.cur_dices();
            var stored_game = game;
            game = this;
            for (var i in dices) {
                var d = dices[i];
                d.can_move(true);
                d.can_jump(true);
                for (var j in d.moves) {
                    var mj = d.moves[j];
                    // move on this
                    if (!d.moveto(mj, this.flag_jump)) continue;
                    // set in case of null pointer.... So bad...
                    if (depth == MINI_MAX_DEPTH) {
                        ret_d = d;
                        ret_mj = mj;
                    }
                    // clone
                    var ai_game = this.clone_for_ai();
                    // revert
                    this.restore(true);
                    // ai_game: take turn, set jump_flag
                    var xxx = game;
                    game = ai_game;
                    ai_game.turn();
                    game = xxx;
                    // ai_game: run alpha-beta pruning minimax
                    var ret1 = ai_game.alphabeta(depth-1, alpha, beta, !is_max);
                    if (is_max) {
                        if (alpha < ret1) {
                            alpha = ret1;
                            if (depth == MINI_MAX_DEPTH) {
                                ret_d = d;
                                ret_mj = mj; // we need them on is_max
                            }
                        }
                    } else {
                        beta = min (beta, ret1);
                    }
                    if (beta <= alpha)  break; // cut-off
                }
                d.clear_move();
            }
            game = stored_game;
            if (is_max) return alpha; 
            else return beta; 
        }

        var expanded_nodes = 0;
        var ret_d, ret_mj;
        Game.prototype.ai_move = function () {
            expanded_nodes = 0;
            this.dont = true;
            try {
                var ret = this.alphabeta(MINI_MAX_DEPTH, 
                        Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, 
                        true); 
            } catch (e) {
                debug ("An error happens when expanding: " + expanded_nodes
                        + ".\n Thus this time we are not using the best "
                        + "result.");
            } finally {
                game = this;
                this.dont = false;
                this.set_selected(ret_d.p);
                this.move_selected(ret_mj.dest);
            }
        }

        // should be called immediately after a game is created.
        // A typical move: [5,2] -> [4,3]
        Game.prototype.handle_ai_first = function () {
            if (this.one_player) {
                if (!this.human) {
                    var src = this.pairs[5][2], dest = this.pairs[4][3];
                    this.set_selected(src);
                    this.move_selected(dest);
                    this.turn();
                }
            }
        }
    }

    { // Decision functions
        Game.prototype.check_win = function () {
            if (this.human) {
                if (arr_empty(this.adices)) {
                    this.winner = "player1";
                } 
            } else {
                if (arr_empty(this.hdices)) {
                    this.winner = "player2";
                }
            }
            if (this.winner){
                if (!this.dont) {
                    var msg = "Congrats, " + this.winner + "! You win!";
                    info (msg);
                    alert(msg);
                }
                return true;
            }
            return false;
        }

        Game.prototype.turn = function () {
            if (this.check_win()) return;
            // turn 
            this.human = !(this.human);
            // set jump_flag
            this.flag_jump = false; 
            if (this.force_jump) {
                this.check_jump(); 
            }
            // AI player
            if (!this.human) {
                if (this.one_player) {
                    this.ai_move();
                    this.turn();
                }
            }
        } 

        Game.prototype.check_jump = function () {
            var arr = this.cur_dices();

            for (var i in arr) {
                if (arr[i].can_jump()) {
                    info ("\nYou should jump first :)");
                    info ("Tip: At least " + arr[i].p.to_string() 
                            + " can jump...\n");
                    this.flag_jump = true;
                    return;
                }
            }
            this.flag_jump = false;
        }
    }

    // assume click can only be triggered by human
    Game.prototype.click = function (p) {
        if (this.winner) return;

        if (this.is_self_selected(p)) {
            this.clear_selected ();
        } else if (this.is_self(p)) {
            this.set_selected (p);
        } else if (this.is_path(p)) {
            if (this.move_selected (p)) {
                this.turn();
            } 
        } else {
            info ("Hey, click you pieces please :)");
        }
    }

    function start_game (human_first, force_jump, one_player) {
        clear_info();
        clear_debug();
        clear_assert();
        info ("Starting game with human_first: " + human_first
                + ", force_jump: " + force_jump 
                + ", one_player: " + one_player);
        game = new Game(human_first, force_jump, one_player);
        game.clear_table ();
        game.place_table ();
        game.handle_ai_first ();
        window.game = game;
    }

    // register events
    var start_btn = get("#start"),
        revert_btn = get("#revert"),
        force_jump = get("#force_jump"),
        human_first = get("#human_first"),
        one_player = get("#one_player"),
        table = get("table");

    start_btn.onclick = function() {
        start_game(human_first.checked, force_jump.checked, 
                one_player.checked);
    }

    revert_btn.onclick = function () {
        if (game.restore()) {
            if (!game.one_player) {
                game.turn();
            }
        }
    }

    var game;
    var MINI_MAX_DEPTH = 4;
    start_game (true, true, true);
})();
