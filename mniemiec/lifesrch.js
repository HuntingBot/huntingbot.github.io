"use strict";				// Force strict Javascript compliance
// Javascript to search list of known patterns for a supplied pattern,
// and then modify DHTML page to provide access to that pattern
// Now also includes Catagolue search and Eppstein glider repository search
// (Still-life search is also integrated, but source is elsewhere)
var X; var Z; var ID; var LOG = "";	// @@@ Debugging variables
// Find index of an object in a list, or -1 if not there
// This is the same as array.indexOf with 1 parameter, but even works with older browsers
function In (list, obj) {
    for (var i = 0; i < list.length; ++i) {
	if (obj === list[i]) {
	    return i;
	}
    }
    return -1;
}
// Fix archaic browsers
if (!Array.prototype.indexOf) {	Array.prototype.indexOf = In (); }	// Missing method from ECMA 262, 5th edition
//------------------------------ Constants -------------------------------------
// These should be "const".
// "var" is to support ancient browsers that don't support "const"
// Math object
var E			= Math.E;
var LN2			= Math.LN2;
var LN10		= Math.LN10;
var LOG2E		= Math.LOG2E;
var LOG10E		= Math.LOG10E;
var PI			= Math.PI;
var SQRT1_2		= Math.SQRT1_2;
var SQRT2		= Math.SQRT2;
var abs			= Math.abs;
var ceil		= Math.ceil;
var exp			= Math.exp;
var floor		= Math.floor;
var log			= Math.log;
var max			= Math.max;
var min			= Math.min;
var pow			= Math.pow;
var round		= Math.round;
var sqrt		= Math.sqrt;
var sin			= Math.sin;
var cos			= Math.cos;
var tan			= Math.tan;
var asin		= Math.asin;
var acos		= Math.acos;
var atan		= Math.atan;
var atan2		= Math.atan2;
var cbrt = Math.cbrt || function (x) { return pow (abs (x), 1/3) * sign (x); }
var sign = Math.sign || function (x) { return x && (x<0 ? -1 : 1); }
var hypot = Math.hypot || function (x, y) { var z = sqrt (x*x+y*y); return z === _ && abs (x) !== _ && abs (y) !== _ ? hypot(x/MAXF_2,y/MAXF_2)*MAXF_2 : x===0 && (abs (x) || abs (y)) ? hypot(x*MAXF_2,y*MAXF_2)/MAXF_2 : z; };
function lopot (x, y) { var z = sqrt (x*x-y*y); return z === _ && abs (x) !== _ ? lopot(x/MAXF_2,y/MAXF_2)*MAXF_2 : x === 0 && abs (x) ? lopot(x*MAXF_2,y*MAXF_2)/MAXF_2 : z; };
var log2 = Math.log2 || function(x) { return log (x) * LOG2E; };
var log10 = Math.log10 || function(x) { return log (x) * LOG10E; };
var trunc = Math.trunc || function (x) { return x<0 ? ceil (x) : floor (x); }
var sinh = Math.sinh || function (x) { return x = exp (x), (x-1/x)/2; };
var cosh = Math.cosh || function (x) { return x = exp (x), (x+1/x)/2; };
var tanh = Math.tanh || function (x) { var u = exp (x), v = 1/u; return u===_ ? 1 : v===_ ? -1 : (u-v)/(u+v); };
var asinh = Math.asinh || function (x) { return x === -_ ? x : log (x + hypot (x, 1)); };
var acosh = Math.acosh || function (x) { return log (x + lopot (x, 1)); };
var atanh = Math.atanh || function (x) { return x === _ ? 1 : x === -_ ? -1 : log ((1+x)/(1-x)) / 2; };
// var expm1 = expm1 || function (x) { return exp (x) - 1; };
// var log1p = log1p || function(x) { return log (1+x); };
// Tunable parameters
var CT			= pow (2, -32);		// Comparison tolerance
var OMEGA		= pow (2, 52);		// Base for index into transfinite numbers
var PAIR		= 1 << 26;		// Fraction to show number pair (PAIR*PAIR<2^53)
var KNOWN		= PAIR/2;		// Gliders known
var TBD			= 2 * KNOWN;		// Gliders TBD
var UNKNOWN		= 3 * KNOWN;		// Gliders unknown
						// (all above must be 2^n to avoid rounding errors)
var LG			= 35;			// All patterns this size and larger are in one bucket
var LARGE		= 1000;			// Can't search larger patterns by image
var MAXPAT		= 1e10;			// Maximum number of patterns in a list
var MAXLIST		= 20;			// Max items in list page (default)
var MAXPAGES		= 20;			// Max pages in enumerated dropdown list
var TIPTIME		= 3;			// Seconds before showing tool tip
var MAXZOOM		= 64;			// Maximum zoom size for image cells
var SCRWIDTH		= 640;			// Nominal sScreen width, for tables, etc.
var COLWIDTH		= 60;			// Column width, in result list
var IMGWIDTH		= 56;			// Image column width, in result list (COLWIDTH-4)
var IMGHEIGHT		= 20;			// Image column height, in result list
var BPLUS		= 1;			// B+nn
var SPLUS		= 1 << 9;		// S+nn
var BMINUS		= SPLUS*SPLUS;		// B-nn
var SMINUS		= BPLUS*SPLUS;		// S-nn
var BUNUSED		= BMINUS*BMINUS;	// (bits above this are not used)
// (NOTE: these two values must be manually updated after each build!
// It changes any time new patterns are added to any of the build.txt files.
// If this is not done, an error popup showing the correct values is shown at startup)
var NUMITEMS		= 14880;		// # normal items (for load progress bar)
var NUMXITEMS		= 121938;	// # extended items (for load progress bar)
// Mathematical constants
var _			= Infinity;		// Infinity
var TAU			= 2*PI;			// Once around the circle
var PHI			= (sqrt (5)+1)/2;	// The Golden Ratio
var MAXF_2		= pow (2, 512);		// sqrt (largest floating point value)
var NCF	= ceil (log (pow (2,53)) / log (PHI));	// Maximum continued fraction length
var FREQBASE		= 50158095316;		// Frequency base for Achim Flammenkamp's rarity experiment
// Unicode characters
var Unbsp		= "\xA0";		// Non-breaking space
var Ulaquo		= "\xAB";		// <<
var Unot		= "\xAC";		// logical not
var Ushy		= "\xAD";		// soft hyphen
var Usup2		= "\xB2";		// Superscript 2
var Usup3		= "\xB3";		// Superscript 3
var Umiddot		= "\xB7";		// middle dot
var Usup1		= "\xB9";		// Superscript 1
var Uraquo		= "\xBB";		// >>
var Ufrac14		= "\xBC";		// 1/4
var Ufrac12		= "\xBD";		// 1/2
var Ufrac34		= "\xBE";		// 3/4
var Utimes		= "\xD7";		// Times
var Udivide		= "\xF7";		// Divide
var UGamma		= "\u0393";		// Greek letter Gamma
var Upi			= "\u03C0";		// Greek letter pi
var Utau		= "\u03C4";		// Greek letter tau
var Uphi		= "\u03C6";		// Greek letter phi
var Uphis		= "\u03D5";		// Greek phi symbol
var Uenspace		= "\u2002";		// En space
var Uemspace		= "\u2003";		// Em space
//var Ubull		= "\u2022";		// Bullet
var Uhellip		= "\u2026";		// Horizontal ellipsis: ...
var Undash		= "\u2013";		// N-dash (decently wide minus sign)
var Ulsquo		= "\u2018";		// Single open quote
var Ursquo		= "\u2019";		// Single close quote
var Uldquo		= "\u201C";		// Double open quote
var Urdquo		= "\u201D";		// Double close quote
var Uuarrow		= "\u2191";		// Up arrow
var Udarrow		= "\u2193";		// Down arrow
var Uradic		= "\u221A";		// Radical, Square root
var Ucbrt		= "\u221B";		// Cube root
var Uqtrt		= "\u221C";		// Fourth root
var Uinf		= "\u221E";		// Infinity
var Ufz			= "\u2225";		// Fuzzy
var Unf			= "\u2226";		// Not fuzzy
var Uand		= "\u2227";		// And
var Uor			= "\u2228";		// Or
var Une			= "\u2260";		// Not equal
var Uequiv		= "\u2261";		// Equivalent
var Unequiv		= "\u2262";		// Not equivalent
var Ule			= "\u2264";		// Less or equal
var Uge			= "\u2265";		// Greater or equal
var Unlt		= "\u226E";		// Not less than
var Ungt		= "\u226F";		// Not greater than
var Unle		= "\u2270";		// Not less than or equal
var Unge		= "\u2271";		// Not greater than or equal
var Ulg			= "\u2276";		// Less or greater
var Unlg		= "\u2278";		// Not less or greater
var Uqbs		= "\u2342";		// Quad backslash
var Ubrect		= "\u25AE";		// Solid (black) rectangle
var Uwrect		= "\u25AF";		// Hollow (white) rectangle
var Ucheck		= "\u2713";		// Check mark
var Umax		= "\u2308";		// Ceiling, Maximum
var Umin		= "\u2310";		// Floor, Minimum
// File signatures
var s_Life_1_05 = "#Life 1.05";			// Signature for Life 1.05 files
var s_Life_1_06 = "#Life 1.06";			// Signature for Life 1.06 files
// External URLs
var js = "javascript:";				// Prefix for internal javascript commands
var url_meth = "meth.htm";			// Methuselahs
var url_color = "color.htm";			// Multi-colored objects
var url_common = "common.htm";			// Common objects
var url_help = "srchhelp.htm";			// Search help
var url_comp1 = "common.htm#nat-p1";		// Common still-lifes
var url_comosc = "common.htm#nat-osc";		// Common oscillators
var url_cat = "https://catagolue.hatsya.com/";		// Catagolue base
var url_costs = "synthesis-costs/";		// Synthesis costs
var url_attr = url_cat + "attribute/";		// Catagolue attribute directory
var url_census = url_cat + "census/";		// Catagolue census directory
var url_comm = "?committed=";			// Haul type
var url_count = "/objcount";			// Count objects instead of listing them
var url_haul = url_cat + "haul/";		// Catagolue haul directory
var url_home = url_cat + "home";		// Catagolue home page
var url_obj = url_cat + "object/";		// Catagolue object directory
var url_rules = url_cat + "rules/";		// Catagolue rules directory
var url_stat = url_cat + "statistics";		// Catagolue statistics
var url_synth = url_cat + "syntheses";		// Catalogue main syntheses page
var url_text = url_cat + "textcensus/";		// Catagolue text census directory
var url_user = url_cat + "user/";		// Catagolue user directory
var url_pent = "http://pentadecathlon.com/";	// Pentadecathlon
var url_sof = url_pent + ".sof?find=";		// Pentadecathlon SOF search form
var url_pentobj = url_pent + "objects/object-indexPage.php?objid=";	// Pentadecathlon category page
var url_epp = "http://fano.ics.uci.edu/ca/rules/";		// Eppstein's glider repository
var url_wiki = "http://conwaylife.com/wiki/";		// LifeWiki
// ASCII/Unicode characters by value
var A_NL		= 0x0A;			// "\n", LF, NL
var A_SP		= 0x20;			// " ", offset for library format
var A_EXCL		= 0x21;			// "!", unary logical not
var A_DQ		= 0x22;			// "\"", tts qualifier, literal delimiter
var A_NUM		= 0x23;			// "#", frequency qualifier
var A_DOL		= 0x24;			// "$", total heat qualiifer, expression letter
var A_PCT		= 0x25;			// "%", temperature qualifier, binary divide
var A_AND		= 0x26;			// "&", svol qualifier
var A_SQ		= 0x27;			// "\'", literal delimiter
var A_LPAR		= 0x28;			// "(", width qualiifer, left parenthesis
var A_RPAR		= 0x29;			// ")", heiht qualifier, right parenthesis
var A_STAR		= 0x2A;			// "*", binary times
var A_PLUS		= 0x2B;			// "+", SOF multi-line separator, binary plus, unary self
var A_COMMA		= 0x2C;			// ",", binary right
var A_MINUS		= 0x2D;			// "-", SOF line separator
var A_PERIOD		= 0x2E;			// ".", decimal separator
var A_SLASH		= 0x2F;			// "/", rule separator, binary divide
var A_0			= 0x30;			// "0", start of digits
var A_9			= 0x39;			// "9", end of digits
var A_COLON		= 0x3A;			// ":", per qualifier
var A_LT		= 0x3C;			// "<", minp qualifier
var A_EQ		= 0x3D;			// "=", avgp qualifier
var A_GT		= 0x3E;			// ">", maxp qualifier
var A_QRY		= 0x3F;			// "?", selection operator
var A_AT		= 0x40;			// "@", vol qualifier
var A_A			= 0x41;			// "A", start of letters
var A_R			= 0x52;			// "R", rotor height
var A_Z			= 0x5A;			// "Z", end of letters
var A_LBRK		= 0x5B;			// "[", boxw qualifier, binary left, unary self
var A_BSL		= 0x5C;			// "\\", binary divide into
var A_RBRK		= 0x5D;			// "]", boxh qualifier, binary right, uniary self
var A_CFX		= 0x5E;			// "^", inf qualifier
var A_UL		= 0x5F;			// "_", underscore in names, expression letter
var A_GRAVE		= 0x60;			// "`", hullw qualifier, start of space runs
var A_a			= 0x61;			// "a", start of page letters, letters in names
var A_b			= 0x62;			// "b", birth rules
var A_l			= 0x6C;			// "l", active rotor cells
var A_n			= 0x6E;			// "n", nuber of rotors
var A_r			= 0x72;			// "r", rotor width
var A_s			= 0x73;			// "s", survival rules
var A_z			= 0x7A;			// "z", end of letters in names
var A_LBRC		= 0x7B;			// "{", lboxw qualifier
var A_STILE		= 0x7C;			// "|", symm qualifier
var A_RBRC		= 0x7D;			// "}", lboxh qualifier
var A_TILDE		= 0x7E;			// "~", hullh qualifier, unary not
var A_orda		= 0xAA;			// ordinal a, letter in names
var A_ordo		= 0xBA;			// ordinal o, letter in names
var A_FRAC14		= 0xBC;			// "1/4", smallest fraction character
var A_FRAC34		= 0xBE;			// "3/4", largest fraction character
var A_agrave		= 0xE0;			// a grave, start of Latin-1 letters in names
var A_div		= 0xF7;			// divide
var A_yuml		= 0xFF;			// y umlaut, end of Latin-1 letters in names
var A_MAX		= 0xFFFF;		// largest allowed Unicode character
var A_LC		= A_a - A_A;		// lower-case - upper-case
var A_RUN		= A_GRAVE - A_SP;	// space run
// Oscillator rotor types (see also: rotenum, rotnames)
var B_NONE		= 0;			// 0 None (not used)
var B_BB		= 1;			// 1 Babbling brook
var B_MM		= 2;			// 2 Muttering moat
var B_EITHER		= 3;			// 3 Either babbling brooks or muttering moat
var B_NEITHER		= 4;			// 4 Neither babbling brooks nor muttering moat
var B_NMM		= 5;			// 5 Not muttering moat
var B_NBB		= 6;			// 6 Not babbling brook
var B_ANY		= 7;			// 7 Any
// Foreground colors
var C_TEXT_NORMAL	= "#000000";		// Text foreground (black)
var C_TEXT_DISABLE	= "#808080";		// Disabled text (grey)
var C_IMG_WILD		= "#808080";		// Image wild cells (grey)
var C_IMG_ALIVE		= "#0000AA";		// Image living cells (dark blue)
var C_img_alive		= 0x0000AA;		// Image living cells (dark blue)
var C_IMG_GRID		= "#AAAAAA";		// Image grid (dark grey)
var C_STAMP_DEAD	= "#00AAAA";		// Stamp dead cells (teal)
var C_STAMP_ALIVE	= "#000000";		// Stamp living cells (black)
var C_FONT_DIGIT	= "#00AAAA";		// Normal gliders (teal)
var C_FONT_EQ		= "#00AA00";		// 1 glider/bit (dark green)
var C_FONT_GT		= "#AAAA00";		// >1 glider/bit (dark yellow)
var C_FONT_X		= "#AA0000";		// unknown (dark red)
var C_FONT_NOTE		= "#AAAAAA";		// Annotations (dark grey)
// Background colors
var C_BG		= "#FFFFFF";		// Screen background color (white)
var C_bg		= 0xFFFFFF;		// Screen background color integer (white)
var C_BG_GREY		= "#E0E0E0";		// Disabled background (light grey)
var C_BG_ACTIVE		= "#FFFFE0";		// Active background (light yellow)
var C_GLS_EQ		= "#C0FFC0";		// 1 glider/bit (light green)
var C_GLS_GT		= "#FFFFC0";		// >1 glider/bit (light yellow)
var C_GLS_X		= "#FFC0C0";		// Unknown synthesis (light red)
var C_GLS_PART		= "#FFD0AA";		// Partial synthesis (light orange)
var C_GLS_KNOWN		= "#C0C0FF";		// Known gliders (light blue)
var C_GLS_TBD		= "#E0E0E0";		// TBD gliders (light grey)
var C_COL_NORMAL	= "#E0E0FF";		// Normal column (pastel blue)
var C_COL_SORT		= "#E0FFE0";		// Normal sort column (pastel green)
var C_COL_BACK		= "#FFE0E0";		// Reverse sort column (pastel red)
var C_ROW_RULE		= "#FFFFE0";		// Rule row (pastel yellow)
var C_ROW_SEL		= "#E0FFFF";		// Selected row (pastel cyan)
var C_row_sel		= 0xE0FFFF;		// Selected row integer (pastel cyan)
var C_STAMP_SEL		= "#E0FFFF";		// Selected stamp cell (pastel cyan)
var C_RULE_OFF		= "#FFFFFF";		// Rule is off (white)
var C_RULE_ON		= "#C0FFC0";		// Rule is on (green)
var C_RULE_PART		= "#FFFFC0";		// Rule is partial (yellow)
// Velocity direction (see also: direnum, dirnames)
var D_NONE		= 0;			// 0: None (not used)
var D_ORTHO		= 1;			// 1: Orthogonal (i.e. y === 0)
var D_DIAG		= 2;			// 2: Diagonal (i.e. y === x)
var D_NOBLIQUE		= 3;			// 3: Not oblique (i.e. orthogonal or diagonal)
var D_OBLIQUE		= 4;			// 4: Oblique (i.e. 0 < y < x || 0 === y === x)
var D_NDIAG		= 5;			// 5: Not diagonal (i.e. orthogonal or oblique)
var D_NORTHO		= 6;			// 6: Not orthogonal (i.e. diagonal or oblique)
var D_ANY		= 7;			// 7: Any
// Stamp image events (non-negative numbers are indices into page)
var E_NONE		= -1;			// Invalid location
var E_PGUP		= -2;			// Page Up (top left corner)
var E_PGDN		= -3;			// Page Down (bottom left corner)
var E_ZIP		= -4;			// Download Zip file (top right corner)
var E_STAMP		= -5;			// Download stamp itself (bottom right corner)
// Font rows
var F_DIGIT		= 0;			// Normal (teal)
var F_EQ		= 1;			// Par (green)
var F_GT		= 2;			// Above par (yellow)
var F_NOTE		= 3;			// Annotation (grey)
var F_SEL		= 4;			// Above 4 rows, w/selection background
// Period 2 oscillator types (see also: ffenum, ffnames)
var H_NONE		= 0;			// 0: None (not used)
var H_FF		= 1;			// 1: Flip-flop
var H_OO		= 2;			// 2: On-off
var H_EITHER		= 3;			// 3: Either flip-flop or on-off
var H_NEITHER		= 4;			// 4: Neither flip-flops nor on-off
var H_NOO		= 5;			// 5: Not on-off
var H_NFF		= 6;			// 6: Not flip-flop
var H_ANY		= 7;			// 7: Any
// Object qualifier flags (see also: p_GetFlags)
var I_FF		= 0x01;			// 01: Flip-flop
var I_OO		= 0x02;			// 02: On-off
var I_PHX		= 0x04;			// 04: Phoenix
var I_BB		= 0x08;			// 08: Babbling brook
var I_MM		= 0x10;			// 10: Muttering moat
var I_Q			= 0x20;			// 20: Quasi-object
// Raging river types (see also: rrenum, rrnames)
var J_NONE		= 0;			// 0: None (not used)
var J_RR		= 1;			// 1: Raging river
var J_NRR		= 2;			// 2: Not raging river
var J_ANY		= 3;			// 3: Any
// Number-matching types (see also: cmpenum)
var M_ANY		= 0;			// Any
var M_INF		= 1;			// n === Infinity
var M_NAN		= 2;			// n === NaN
var M_UNKNOWN		= 3;			// n >= "x"
var M_PARTIAL		= 4;			// n > "x"
var M_TBD		= 5;			// n === TBD
var M_KNOWN		= 6;			// n === KNOWN
var M_EQ		= 7;			// n === y
var M_NE		= 8;			// n !== y
var M_LT		= 9;			// n < y
var M_LE		= 10;			// n <= y
var M_GT		= 11;			// n > y
var M_GE		= 12;			// n >= y
var M_IN		= 13;			// x <= n <= y (in range)
var M_OUT		= 14;			// n < x || y < n (out of range)
var M_MAX		= 15;			// (all other values are below this)
// Real number formats (see also: numenum)
var N_DEC		= 0;			// Decimal
var N_RAT		= 1;			// Rational
var N_MIXED		= 2;			// Mixed
// Object categories (see also: catenum, catlist, catpage, catnames, catabbrs, catapg)
var O_STILL		= 0;			// 0: Still life
var O_PSTILL		= 1;			// 1: Pseudo-still-life
var O_QSTILL		= 2;			// 2: Quasi-still-life
var O_OSC		= 3;			// 3: Oscillator
var O_POSC		= 4;			// 4: Pseudo-oscillator
var O_QOSC		= 5;			// 5: Quasi-oscillator
var O_SS		= 6;			// 6: Spaceship, flotilla
var O_PSS		= 7;			// 7: Pseudo-spaceship (, flotilla)
var O_QSS		= 8;			// 8: Quasi-spaceship (, flotilla)
var O_WS		= 9;			//    Wick stretcher
var O_PUFF		= 10;			//    Puffer
var O_GUN		= 11;			//    Gun
var O_BR		= 12;			//    Breeder
var O_CONS		= 13;			//    Constellation
var O_METH		= 14;			//    Methuselah
var O_ANY		= 15;			//    Any
var O_MULTI		= 16;			//    Multiple...
var O_OV		= 17;			//    Over-sized (rest are for Catagolue)
var O_ZZ		= 18;			//    Growing
var O_PATH		= 19;			//    Pathological
var O_MAX		= 20;			// (all values are below this)
// Object category masks (see above)
var OM_STILL		= 1 << O_STILL;		// Still life
var OM_PSTILL		= 1 << O_PSTILL;	// Pseudo-still-life
var OM_QSTILL		= 1 << O_QSTILL;	// Quasi-still-life
var OM_OSC		= 1 << O_OSC;		// Oscillator
var OM_POSC		= 1 << O_POSC;		// Pseudo-oscillator
var OM_QOSC		= 1 << O_QOSC;		// Quasi-oscillator
var OM_SS		= 1 << O_SS;		// Spaceship, flotilla
var OM_PSS		= 1 << O_PSS;		// Pseudo-spaceship (, flotilla)
var OM_QSS		= 1 << O_QSS;		// Quasi-spaceship (, flotilla)
var OM_WS		= 1 << O_WS;		// Wick stretcher
var OM_PUFF		= 1 << O_PUFF;		// Puffer
var OM_GUN		= 1 << O_GUN;		// Gun
var OM_BR		= 1 << O_BR;		// Breeder
var OM_CONS		= 1 << O_CONS;		// Constellation
var OM_METH		= 1 << O_METH;		// Methuselah
var OM_ANY		= 1 << O_ANY;		// Any
var OM_MULTI		= 1 << O_MULTI;		// Multiple...
var OM_NONE		= 0			// No valid patterns
var OM_ALL		= OM_ANY - 1;		// All patterns
var OM_QUASIS		= OM_QSTILL | OM_QOSC | OM_QSS;		// Quasi-objects (part of constellations)
var OM_LINEAR		= OM_WS | OM_PUFF | OM_GUN;		// Linear growing patterns (Catagolue yl_)
var OM_MOVES		= OM_SS | OM_PSS | OM_QSS | OM_CONS;	// Moving patterns (Catagolue xq_)
var OM_STILLS		= OM_STILL | OM_PSTILL | OM_QSTILL | OM_CONS;	// Still patterns (Catagolue xs_)
var OM_OSCS		= OM_OSC | OM_POSC | OM_QOSC | OM_CONS;	// Oscillating patterns (Catagolue xp_)
var OM_PERS		= OM_ALL - OM_STILLS | OM_CONS;		// Patterns w/period
var OM_RARS		= OM_STILL | OM_OSC;			// Patterns w/rarity
var OM_VELS		= OM_MOVES | OM_WS | OM_PUFF | OM_BR | OM_METH;	// Patterns w/velocity
var OM_CATS		= OM_STILLS | OM_OSCS | OM_MOVES;	// Searchable on Catagolue by pattern
var OM_LG		= OM_STILLS | OM_POSC | OM_PSS | OM_CONS | OM_METH;	// Has section on bits-lg
// Phoenix selections (see also: phxenum, phxnames)
var P_NONE		= 0;			// 0: None (not used)
var P_PHX		= 1;			// 1: Phoenix
var P_NPHX		= 2;			// 2: Not phoenix
var P_ANY		= 3;			// 3: Any
// Supported rules (see also: ruleenum, rulepage, rulesec, rulerle, rulemask, rulenames, rulelib, rulehrd, rulefiles)
var R_B3S23		= 0;			// Life
var R_B2S2		= 1;			// B2/S2 (2/2 Life)
var R_B34S34		= 2;			// B34/S34 (34 Life)
var R_B36S23		= 3;			// B36/S23 (HighLife)
var R_B36S245		= 4;			// B36/S245 (Replicator rule)
var R_B3S238		= 5;			// B3/S238 (EightLife/Pulsar Life)
var R_B38S23		= 6;			// B38/S23 (Pedestrian Life)
var R_B38S238		= 7;			// B38/S238 (Honey Life)
var R_LEAP		= 8;			// LeapLife
var R_VESSEL		= 9;			// VesselLife
var R_NIEMIEC0		= 10;			// Niemiec's rule 0
var R_NIEMIEC1		= 11;			// Niemiec's rule 1
var R_NIEMIEC2		= 12;			// Niemiec's rule 2
var R_NIEMIEC4		= 13;			// Niemiec's rule 4
var R_NIEMIEC5		= 14;			// Niemiec's rule 5
var R_TOTAL		= 15;			// Unsupported outer totalistic rule from RLE
var R_NTOTAL		= 16;			// Unsupported non-totalistic rule from RLE
var R_OTHER		= 17;			// Unsupported other rule from RLE
var R_ANY		= 18;			// Any rules
var R_MAX		= 19;			// (All values are below this)
// Sort options (n=ascending, ~n=descending; see also: sortenum, sortnames)
var S_MINP		= 0;			// By minimum population
var S_AVGP		= 1;			// By average population
var S_MAXP		= 2;			// By maximum population
var S_RPOP		= 3;			// By population ratio
var S_INF		= 4;			// By influence
var S_DEN		= 5;			// By minimum density
var S_ADEN		= 6;			// By average density
var S_MDEN		= 7;			// By maximum density
var S_HEAT		= 8;			// By heat
var S_TEMP		= 9;			// By temperature
var S_VOL		= 10;			// By volatility
var S_SVOL		= 11;			// By strict volatility
var S_RVOL		= 12;			// By strict volatility/volatility
var S_SYMM		= 13;			// By symmetry
var S_GLIDE		= 14;			// By symmetry
var S_BOXW		= 15;			// By smallest bounding box width
var S_BOXH		= 16;			// By smallest bounding box height
var S_BOXD		= 17;			// By smallest bounding box diagonal
var S_BOXC		= 18;			// By smallest bounding box circumference
var S_BOXA		= 19;			// By smallest bounding box area
var S_BOXS		= 20;			// By smallest bounding box squareness
var S_LBOXW		= 21;			// By largest bounding box width
var S_LBOXH		= 22;			// By largest bounding box height
var S_LBOXD		= 23;			// By largest bounding box diagonal
var S_LBOXC		= 24;			// By largest bounding box circumference
var S_LBOXA		= 25;			// By largest bounding box area
var S_LBOXS		= 26;			// By largest bounding box squareness
var S_HULLW		= 27;			// By hull width
var S_HULLH		= 28;			// By hull height
var S_HULLD		= 29;			// By hull diagonal
var S_HULLC		= 30;			// By hull circumference
var S_HULLA		= 31;			// By hull area
var S_HULLS		= 32;			// By hull squareness
var S_RBOXW		= 33;			// By rotor box width
var S_RBOXH		= 34;			// By rotor box height
var S_RBOXD		= 35;			// By rotor box diagonal
var S_RBOXC		= 36;			// By rotor box circumference
var S_RBOXA		= 37;			// By rotor box area
var S_RBOXS		= 38;			// By rotor box squareness
var S_ACT		= 39;			// By active rotor cells
var S_NROT		= 40;			// By number of rotors
var S_PER		= 41;			// By period
var S_MOD		= 42;			// By modulus
var S_RMOD		= 43;			// By period/modulus
var S_VEL		= 44;			// By velocity
var S_SLP		= 45;			// By slope
var S_GLS		= 46;			// By number of gliders
var S_RGLS		= 47;			// By gliders/bit
var S_GLNA		= 48;			// By glider number (all)
var S_GLNR		= 49;			// By glider number (rule)
var S_FREQ		= 50;			// By frequency
var S_RAR		= 51;			// By rarity
var S_TTS		= 52;			// By time to stabilize
var S_EF		= 53;			// By evolutionary factor
var S_CAT		= 54;			// By category
var S_NBR		= 55;			// By neighborhoods
var S_HDR		= 56;			// By header name
var S_FILE		= 57;			// By file name
var S_APG		= 58;			// By apg search name
var S_SOF		= 59;			// By SOF name
var S_LIS		= 60;			// By LIS name
var S_HRD		= 61;			// By HRD name
var S_WIKI		= 62;			// By Wiki name (not yet implemented)
var S_PAT		= 63;			// By pattern name
var S_IMG		= 64;			// By image
var S_NATIVE		= 65;			// By original database order
var S_MAX		= 66;			// (All sort columns are below this)
// Catagolue search types (see also: typeenum, typeurls, typerules)
var T_HOME		= 0;			// Display catagolue home page
var T_ATTR		= 1;			// Display object attributes
var T_CENSUS		= 2;			// Display census
var T_HAUL		= 3;			// Display hauls
var T_OBJECT		= 4;			// Display object soups
var T_COUNT		= 5;			// Display object counts
var T_LIST		= 6;			// Display object list
var T_RULES		= 7;			// Display rules page
var T_STAT		= 8;			// Display statistics
var T_SYNL		= 9;			// Display syntheses list
var T_SYNT		= 10;			// Display syntheses table
var T_USER		= 11;			// Display user name
// Output view formats (see also: viewenum)
var V_LIST		= 0;			// View as list
var V_STAMP		= 1;			// View as stamp page
// String-matching types (NOTE: Specified numbers must not be changed) (see also: wildenum)
var W_IS		= 0;			// 0: Is (e.g. "x")
var W_BEGINS		= 1;			// 1: Begins with (e.g. "x*")
var W_ENDS		= 2;			// 2: Ends with (e.g. "*x")
var W_CONTAINS		= 3;			// 3: Contains (e.g. "*x*")
var W_ANY		= 4;			// 4: Any (e.g. "*")
var W_NOT		= 8;			//    Invert sense of search (e.g. "~x")
var W_NOTIS		= W_NOT + W_IS;		// Is not
var W_NOTBEGINS		= W_NOT + W_BEGINS;	// Does not begin with
var W_NOTENDS		= W_NOT + W_ENDS;	// Does not end with
var W_NOTCONTAINS	= W_NOT + W_CONTAINS;	// Does not contain
// File import/export format (see also: expenum, expnames)
var X_IMAGE		= -1;			// Image on screen
var X_RLE		= 0;			// RLE: #comments. header. run-length encoded pattern
var X_CELLS		= 1;			// Cells: !comments, text as . and o
var X_LIFE105		= 2;			// Life 1.05: #comments, text as . and *
var X_LIFE106		= 3;			// Life 1.06: #comments, coordinate pairs
var X_APG		= 4;			// Apg: header_encoding
var X_LIS		= 5;			// LIS: period population height width encoding[\tcomments]
var X_SOF		= 6;			// SOF: encoding. (name) !comments
// Symmetry and Glide symmetry (see also: symmenum, symmchars, symmnames, symmbits)
//  (NOTE: Specified numbers 0-9 must not be changed; rest are UI only)
var Y_C1		= 0;			// C1	0: None: "."
var Y_D2P		= 1; 			// D2_+	1: Orthogonal: "-" (actually, "|")
var Y_D2X		= 2;			// D2_x	2: Diagonal: "/" (actually, "\\")
var Y_C2		= 3;			// C2	3: 180-degree rotation: "~"
var Y_D4P		= 4;			// D4_+	4: Double orthogonal: "+"
var Y_D4X		= 5;			// D4_x	5: Double diagonal: "x"
var Y_C4		= 6;			// C4	6: 90-degree rotation: "@"
var Y_D8		= 7;			// D8	7: 8-way: "*"
var Y_D2P2		= 8;			// D2_+	8: Vertical: "-" (internal+temporary)
var Y_D2X2		= 9;			// D2_x	9: Antidiagonal: "/" (internal+temporary)
var Y_D2		= 10;			// D2		Single reflection (- /)
var Y_D4		= 11;			// D4		Two reflections (+ x)
var Y_D48P		= 12;			// D4|8_+	Includes + (+ *)
var Y_D48X		= 13;			// D4|8_x	Includes x (x *)
var Y_C24		= 14;			// C2|4		Any rotation (~ @)
var Y_C4D8		= 15;			// C4|D8	Includes @ (@ *)
var Y_D248P		= 16;			// D2|4|8_+	Includes - (- + *)
var Y_D248X		= 17;			// D2|4|8_*	Includes / (/ x *)
var Y_D48		= 18;			// D4|8		Includes two reflections (+ x *)
var Y_D248		= 19;			// D2|4|8	Any reflection (- / + x *)
var Y_C24D48		= 20;			// C2|4|D4|8	Includes ~ (~ + x @ *)
var Y_C24D248		= 21;			// C2|4|D2|4|8	Any symmetry (- / ~ + x @ *)
var Y_ANY		= 22;			// C2|4|D1|2|4|8 Any (. - / ~ + x @ *)
// Search state
var Z_LOADING		= 0;			// Loading data initially
var Z_RESET		= 1;			// Nothing shown (starting state)
var Z_SEARCH		= 2;			// Searching...
var Z_HUGE		= 3;			// Pattern too huge to search for
var Z_NONE		= 4;			// No results
var Z_MANY		= 5;			// Multiple results shown in list
var Z_RESULT		= 6;			// Single result is selected
// Misc. constants
var HUGEPAT		= "\n\n";		// Fake image for huge patterns (e.g. Caterpillar, Gemini)
// Constant arrays
var perpage = [1,2,3,4,5,6,7,8,9,10,12,14,15,16,20,24,30,36,40,46,60,120];	// R_B3S23 periods w/own pages
var fontwidth = [8,4,8,8,8, 8,8,8,8,8, 8,8,12,8,8, 8,8,8,8,8, 8,8,8,8,4];	// Character widths
var fontascii = "0123456789+e-.Pc/^<>(,)x ";	// ASCII equivalents of built-in font
var ownsec = "p1 pp1 p2 pp2 p3".split (" ");	// These sections have own pages:
var ownlo = [13, 14, 17, 16, 20];		// From this size ...
var ownhi = [18, 16, 18, 17, 21];		// ... to this size
var suffc = Ufrac14 + Ufrac12 + Ufrac34 + Usup1 + Usup2 + Usup3 + "!" +
  "e" + Upi + Utau + Uphi + Uphis;		// Suffix characters
var suffn = [1/4, 1/2, 3/4, 1, 2, 3, 0, E, PI, TAU, PHI, PHI];	// Suffix values
var keywords = [/pi/g, /phi/g, /tau/g, /inf/g, /infinity/g, /unknown/g, /nan/g,
  /sqrt/g, /root/g, / /g];			// Numeric keywords
var keychars = [Upi, Uphi, Utau, "_", "_", "?", "?", Uradic, Uradic, ""];	// 1-character equivalents
var apgdigits = "0123456789";				// Digits used in apg search names
var apgchars = "0123456789abcdefghijklmnopqrstuvwxyz";	// Base-36 alphabet used in apg search names
var apgzeros = ";0;w;x".split (";");		// 0-3 empty characters in apg search names
var ordnames = ["/t"+Usup3, "/t"+Usup2, "/t", "", "t", "t"+Usup2, "t"+Usup3, "c"];	// Orders of magnitude names
var catlist = "p1;pp1;qp1;osc;posc;qosc;ss;pss;qss;ws;puff;gun;br;cons;meth".split (";");	// Category names
var catpage = "p1;pp1;qp1;period;pperiod;qperiod;ss;pss;qss;puff;puff;gun;breeder;cons;meth".split (";");	// Category pages
var catapg = "xs;xs;xs;xp;xp;xp;xq;xq;xq;yl;yl;yl;;;;;;ov;zz;PATHOLOGICAL".split (";");	// Category APG prefixes
var symmchars = "C1;D2_+;D2_x;C2;D4_+;D4_x;C4;D8;D2_+;D2_x".split (";");	// Symmetry names
var symmbits = [1<<Y_C1, 1<<Y_D2P, 1<<Y_D2X, 1<<Y_C2, 1<<Y_D4P, 1<<Y_D4X,	// Symmetry bit masks
    1<<Y_C4, 1<<Y_D8, 1<<Y_D2P, 1<<Y_D2X, (1<<Y_D2P)|(1<<Y_D2X),
    (1<<Y_D4P)|(1<<Y_D4X), (1<<Y_D4P)|(1<<Y_D8), (1<<Y_D4X)|(1<<Y_D8),
    (1<<Y_C2)|(1<<Y_C4), (1<<Y_C4)|(1<<Y_D8), (1<<Y_D2P)|(1<<Y_D4P)|(1<<Y_D8),
    (1<<Y_D2X)|(1<<Y_D4X)|(1<<Y_D8), (1<<Y_D2P)|(1<<Y_D4X)|(1<<Y_D8),
    (1<<Y_D2P)|(1<<Y_D2X)|(1<<Y_D4P)|(1<<Y_D4X)|(1<<Y_D8),
    (1<<Y_C2)|(1<<Y_C4)|(1<<Y_D4P)|(1<<Y_D4X)|(1<<Y_D8),
    (1<<Y_C2)|(1<<Y_C4)|(1<<Y_D2P)|(1<<Y_D2X)|(1<<Y_D4P)|(1<<Y_D4X)|(1<<Y_D8),
    (1<<Y_C1)|(1<<Y_C2)|(1<<Y_C4)|(1<<Y_D2P)|(1<<Y_D2X)|(1<<Y_D4P)|(1<<Y_D4X)|(1<<Y_D8)];
// Polynomial coefficients for 1/Gamma(x), 0<x<1. From Abramowitz & Stegun 6.1.34
var gpoly = [0.0,       1.0,                 0.5772156649015329,
  -0.6558780715202538, -0.0420026350340952,  0.1665386113822915,
  -0.0421977345555443, -0.0096219715278770,  0.0072189432466630,
  -0.0011651675918591, -0.0002152416741149,  0.0001280502823882,
  -0.0000201348547807, -0.0000012504934821,  0.0000011330272320,
  -0.0000002056338417,  0.0000000061160950,  0.0000000050020075,
  -0.0000000011812746,  0.0000000001043427,  0.0000000000077823,
  -0.0000000000036968,  0.0000000000005100, -0.0000000000000206,
  -0.0000000000000054,  0.0000000000000014,  0.0000000000000001];
// Rule search constants
var base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";	// base64 encoding table
var nnbrs = [8, 6];					// Number of neighbors in each neighborhood
var narrs = [[1,2,6,10,13,10,6,2,1],[1,1,3,3,3,1,1]];	// Number of arrangements of each neighbor [Moore],[Hex]
var hensel = [["","ce","cekani","cekinyqajr","cekryqajtiwzn","cekinyqajr","cekani","ce",""],
  ["","","omp","omp","omp","",""]];			// Hensel's arrangement names + Callahan's hex arrangements
var henselh = ["","","aki","aqy","aki","",""];		// Hensel-equivalent alternet hex arrangement names
var specnames = ["life", "highlife",			// Names of some specific rules
  "seeds", "live free or die", "justfriends",
  "hexlife", "hezlife", "callahan",
  "niemiec0", "niemiec1", "niemiec2", "niemiec3",
  "niemiec4", "niemiec5", "niemiec6", "niemiec7"];
var specrules = ["b3/s23", "b36/s23",			// Rule strings of some specific rules
  "b2/s", "b2/s0", "b2-a/s12",
  "b2om/s2h", "b2s34h", "b2o/s2m34h",
  "b3/s2ae3aeijr4-cknqy", "b3/s2ae3aeijr4-ckqy",
  "b3/s2aei3aeijr4-cknqy", "b3/s2aei3aeijr4-ckqy",
  "b3/s2ae3aeijr4-cknqy5e", "b3/s2ae3aeijr4-ckqy5e",
  "b3/s2aei3aeijr4-cknqy5e", "b3/s2aei3aeijr4-ckqy5e"];
var rulebits = [[[0x00],[0x02,0x01],[0x0A,0x05,0x09,0x03,0x22,0x11],	// Rule table bits
   [0x2A,0x15,0x25,0x0E,0x0B,0x29,0x23,0x07,0x0D,0x13],
   [0xAA,0x55,0x4B,0x17,0x2B,0x27,0x0F,0x35,0x39,0x1B,0x63,0x33,0x2E],
   [0xD5,0xEA,0xDA,0xF1,0xF4,0xD6,0xDC,0xF8,0xF2,0xEC],
   [0xF5,0xFA,0xF6,0xFC,0xDD,0xEE],[0xFD,0xFE],[0xFF]],
  [[0x00],[0x01],[0x03,0x05,0x09],[0x07,0x0B,0x15],[0xFC,0xFA,0xF6],[0x3E],[0x3F]]];
var mdn2native = [[[0], [0,1], [3,0,2,4,1,5], [3,8,6,9,4,7,0,5,2,1], [6,12,8,10,7,2,3,11,4,5,9,0,1], [7,4,8,3,9,1,6,2,5,0], [3,1,2,0,5,4], [1,0], [0], []],
		  [[0], [0], [0,1,2], [0,1,2], [0,1,2], [0], [0], [], [], []]];	// MDN conditions to internal ones
var mdntotal = [	// Non-totalistic to MDN numbered neighborhoods (used for MAP rule)
   [0x00, 0x10, 0x11, 0x20, 0x10, 0x21, 0x20, 0x30, 0x11, 0x20, 0x24, 0x35, 0x22, 0x34, 0x31, 0x40,
    0x11, 0x22, 0x24, 0x31, 0x20, 0x34, 0x35, 0x40, 0x25, 0x33, 0x39, 0x46, 0x33, 0x4A, 0x46, 0x53,
    0x10, 0x21, 0x22, 0x34, 0x23, 0x36, 0x32, 0x41, 0x20, 0x30, 0x31, 0x40, 0x32, 0x41, 0x43, 0x50,
    0x22, 0x37, 0x38, 0x45, 0x32, 0x48, 0x49, 0x52, 0x33, 0x42, 0x44, 0x51, 0x47, 0x54, 0x56, 0x60,
    0x11, 0x22, 0x25, 0x33, 0x22, 0x37, 0x33, 0x42, 0x24, 0x31, 0x39, 0x46, 0x38, 0x45, 0x44, 0x51,
    0x24, 0x38, 0x39, 0x44, 0x31, 0x45, 0x46, 0x51, 0x39, 0x44, 0x4C, 0x59, 0x44, 0x58, 0x59, 0x63,
    0x20, 0x34, 0x33, 0x4A, 0x32, 0x48, 0x47, 0x54, 0x35, 0x40, 0x46, 0x53, 0x49, 0x52, 0x56, 0x60,
    0x31, 0x45, 0x44, 0x58, 0x43, 0x57, 0x56, 0x62, 0x46, 0x51, 0x59, 0x63, 0x56, 0x62, 0x65, 0x71,
    0x10, 0x23, 0x22, 0x32, 0x21, 0x36, 0x34, 0x41, 0x22, 0x32, 0x38, 0x49, 0x37, 0x48, 0x45, 0x52,
    0x20, 0x32, 0x31, 0x43, 0x30, 0x41, 0x40, 0x50, 0x33, 0x47, 0x44, 0x56, 0x42, 0x54, 0x51, 0x60,
    0x21, 0x36, 0x37, 0x48, 0x36, 0x4B, 0x48, 0x55, 0x34, 0x41, 0x45, 0x52, 0x48, 0x55, 0x57, 0x61,
    0x34, 0x48, 0x45, 0x57, 0x41, 0x55, 0x52, 0x61, 0x4A, 0x54, 0x58, 0x62, 0x54, 0x64, 0x62, 0x70,
    0x20, 0x32, 0x33, 0x47, 0x34, 0x48, 0x4A, 0x54, 0x31, 0x43, 0x44, 0x56, 0x45, 0x57, 0x58, 0x62,
    0x35, 0x49, 0x46, 0x56, 0x40, 0x52, 0x53, 0x60, 0x46, 0x56, 0x59, 0x65, 0x51, 0x62, 0x63, 0x71,
    0x30, 0x41, 0x42, 0x54, 0x41, 0x55, 0x54, 0x64, 0x40, 0x50, 0x51, 0x60, 0x52, 0x61, 0x62, 0x70,
    0x40, 0x52, 0x51, 0x62, 0x50, 0x61, 0x60, 0x70, 0x53, 0x60, 0x63, 0x71, 0x60, 0x70, 0x71, 0x80],
   [0x00, 0x10, 0x10, 0x20, 0x10, 0x20, 0x21, 0x30, 0x10, 0x21, 0x20, 0x30, 0x22, 0x31, 0x31, 0x40,
    0x10, 0x21, 0x22, 0x31, 0x20, 0x30, 0x31, 0x40, 0x21, 0x32, 0x31, 0x41, 0x31, 0x41, 0x42, 0x50,
    0x10, 0x22, 0x21, 0x31, 0x21, 0x31, 0x32, 0x41, 0x20, 0x31, 0x30, 0x40, 0x31, 0x42, 0x41, 0x50,
    0x20, 0x31, 0x31, 0x42, 0x30, 0x40, 0x41, 0x50, 0x30, 0x41, 0x40, 0x50, 0x40, 0x50, 0x50, 0x60]];
// Strings for saving/loading enum values by name
var cmpenum = "awzxptkenldguio";			// Comparison types
var wildenum = "ibeca   IBEC"				// Wild types
var phxenum = "ApPa"					// Phoenix types
var rrenum = "ArRa";					// River types
var ffenum = "AfoeEOFa";				// Period 2 oscillator types
var rotenum = "AbmeEmba";				// Rotor types
var direnum = "AodKkDOa";				// Directions
var typeenum = "iachoklrsytu";				// Catagolue search types
var viewenum = "ls";					// View types
var numenum = "dqm";					// Number formats
var expenum = "irc56als";				// Export formats
var catenum = "sSCoOkqQKwpgbcmalvzP";			// Categories
var ruleenum = "B3S23;B2S2;B34S34;B36S23;B36S245;B3S238;B38S23;B38S238;LEAP;VESSEL;NIEMIEC0;NIEMIEC1;NIEMIEC2;NIEMIEC4;NIEMIEC5;TOTAL;NTOTAL;OTHER;ANY".split (";");	// Rules
var symmenum = "C1;D2P;D2X;C2;D4P;D4X;C4;D8;D2P2;D2X2;D2;D4;D48P;D48X;C24;C4D8;D248P;D248X;D48;D248;C24D48;C24D248;ANY".split (";");	// Symmetries
var sortenum = ["MINP", "AVGP", "MAXP", "RPOP", "INF", "DEN", "ADEN", "MDEN", "HEAT", "TEMP",
  "VOL", "SVOL", "RVOL", "SYMM", "GLIDE", "BOXW", "BOXH", "BOXD", "BOXC", "BOXA",
  "BOXS", "LBOXW", "LBOXH", "LBOXD", "LBOXC", "LBOXA", "LBOXS", "HULLW", "HULLH", "HULLD",
  "HULLC", "HULLA", "HULLS", "RBOXW", "RBOXH", "RBOXD", "RBOXC", "RBOXA", "RBOXS", "ACT",
  "NROT", "PER", "MOD", "RMOD", "VEL", "SLP", "GLS", "RGLS", "GLNA", "GLNR",
  "FREQ", "RAR", "TTS", "EF", "CAT", "NBR", "HDR", "FILE", "APG", "SOF",
  "LIS", "HRD", "WIKI", "NAME", "IMG", "NATIVE"];	// Sort orders
//------------------------------ Class definitions -----------------------------
// Constructor for binary field structure
function Field (wid, hgt) {
    this.f_wid = wid;		// Width of allocated array
    this.f_hgt = hgt;		// Height of allocated array
    this.f_lft = 0;		// Left limit of living cells
    this.f_top = 0;		// Top limit of living cells
    this.f_rgt = wid;		// Right limit of living cells + 1
    this.f_btm = hgt;		// Bottom limit of living cells + 1
    this.f_minp = 0;		// Count of living cells (assuming wild cards are dead)
    this.f_maxp = 0;		// Count of living cells (assuming wild cards are alive)
    this.f_wild = 0;		// 0=dead, 1=some alive, -1=some wild
    var n = wid * hgt;
    var a = this.f_img = new Array (n);	// Image: Array [y*f_wid+x] (0=dead, 1=alive, -1=wild)
    while (--n >= 0) {
	a[n] = 0;
    }
}
// Field method: Get a cell from the field, assuming cells outside borders are zero
function f_GetCell (x, y) {
    return x < 0 || x >= this.f_wid || y < 0 || y >= this.f_hgt ? 0 :
	this.f_img[y*this.f_wid+x];
}
Field.prototype.f_GetCell = f_GetCell;
// Field method: Is this a still-life in an outer totalistic rule? (0=no, 1=yes, -1=unsure)
// Also calculates minimum and maximum populations as a side-effect
function f_IsStill (r) {
    this.f_minp = this.f_maxp = 0;
    for (y = this.f_top; y < this.f_btm; ++y) {
	for (x = this.f_lft; x < this.f_rgt; ++x) {
	    this.f_minp += (c = this.f_img[y*this.f_wid+x]) > 0;
	    this.f_maxp += c !== 0;
	}
    }
    // (Theoretically, some limited wild cards might still allow patterns to remain still-lifes,
    //  no matter whether they are alive or dead; however, as we don't want to
    //  trigger various still-life optimizations in such cases, we don't check for them.)
    if (this.f_minp !== this.f_maxp) {		// Any wildcards make this unsure
	return -1;
    }
    r = rulemask[r];
    // (NOTE: An empty field should be a still-life in any rule (except ones with B0);
    // However, this case is sufficiently rare that it is not worth worrying about.)
    if (!r) {					// For now, non-totalistic rules are always unsure
	return -1;
    }
    for (var y = this.f_top-1, m = y*this.f_wid, u = m-this.f_wid, d = m+this.f_wid;
      y <= this.f_btm; ++y, u += this.f_wid, m += this.f_wid, d += this.f_wid) {
	for (var x = this.f_lft-1; x <= this.f_rgt; ++x) {
	    var c = this.f_img[m+x];
	    var n = this.f_img[u+x-1] + this.f_img[u+x] + this.f_img[u+x+1] +
		    this.f_img[m+x-1]                   + this.f_img[m+x+1] +
		    this.f_img[d+x-1] + this.f_img[d+x] + this.f_img[d+x+1] + 10*c;
	    if (((r >> n) & 1) !== c) {		// Any births or deaths make this not still
		return 0;
	    }
	}
    }
    return 1;
}
Field.prototype.f_IsStill = f_IsStill;
// Field method: Get Influence (mainly for search image, as if anyone really cares!)
function f_GetInf () {
    var r = 0;
    for (var y = this.f_top-1, r = y*this.f_wid, u = r-this.f_wid, d = r+this.f_wid;
      y <= this.f_btm; ++y, u += this.f_wid, r += this.f_wid, d += this.f_wid) {
	for (var x = this.f_lft-1; x <= this.f_rgt; ++x) {
	    r += (this.f_img[u+x-1] | this.f_img[u+x] | this.f_img[u+x+1] |
		  this.f_img[r+x-1] | this.f_img[r+x] | this.f_img[r+x+1] |
		  this.f_img[d+x-1] | this.f_img[d+x] | this.f_img[d+x+1]) !== 0;
	}
    }
    return r;
}
Field.prototype.f_GetInf = f_GetInf;
// Constructor for header structure, for a group of related patterns
// (In addition, some instances may also define h_synth, h_disc)
function Header (rule, name, sec, sub, cat, cid, exp, gls, pseudo, per, minp, obj) {
    this.h_rule = rule		// Rule containing this header
    this.h_name = name;		// Name: machine-specific string
    this.h_sec = sec;		// Section: machine-specific string
    this.h_sub = sub;		// Subsection: machine-specific string
    this.h_cat = cat;		// Category: human-readable string
    this.h_cid = cid;		// Category id: integer index; sec=catlist[cid]
    this.h_exp = exp;		// Is this an expanded object source list?: (boolean)
    this.h_gls = gls;		// Gliders for unspecified items (KNOWN or TBD)
    this.h_pseudo = pseudo;	// pseudo-stills/oscillators/spaceships (boolean)
    this.h_per = per;		// Period: integer for stills/oscillators; else NaN
    this.h_minp = minp;		// Population: integer for stills/oscillators; else NaN
    this.h_obj = obj;		// Object list: Array of Pattern
    ++numhid;			// Count headers
}
// Constructor for pattern structure
// Image starts out as one string, but may grow into an array of strings
// Several fields may contain temporary negative values, indicating that they
// accumulate data from subsequent sub-images, which will be normalized by EndObj
// (In addition, some instances may also define:
//  p_comm, p_file2, p_hrd, p_soup, p_color, p_glnr, p_glna, p_synth, p_disc,
//  and header/stats may define other fields: p_rpop, p_den, p_aden, p_mden,
//  p_rvol, p_glide, p_boxd, p_boxc, p_boxa, p_boxs, p_lboxd, p_lboxc, p_lboxa, p_lboxs,
//  p_hulld, p_hullc, p_hulla, p_hulls, p_rboxw, p_rboxh, p_rboxd, p_rboxc, p_rboxa, p_rboxs,
//  p_mod, p_rmod, p_rgls, p_rar, p_ef)
// p_symm is a combination of flags:
//   symmetry class: (Y_C1,Y_D2P,Y_D2X,Y_C2,Y_D4P,Y_D4X,Y_C4,Y_D8,Y_D2P2,Y_D2X2)
//   +10*glide symmetry: (Y_C1,Y_D2P,Y_D2X,Y_C2,Y_C4,Y_D2P2,Y_D2X2)
//   +100*glide_parity_calculated (+200*odd_width +400*odd_height +800*empty)
//   +1000*(period/modulus) (1,2,4)
//   +10000*qualifier flags (I_FF,I_OO,I_PHX,I_BB,I_MM)
// p_nbr is B+|S+<<9|B-<<18|S-<<27|B~<<36|S~<<45
function Pattern (idx, img, file, apg, name, cid, minp, maxp, avgp,
  inf, heat, temp, vol, svol, symm, boxw, boxh, lboxw, lboxh, hullw, hullh,
  per, gls, freq, tts, veld, velx, vely, nbr, page, hid) {
    this.p_idx = idx;		// Index: ordinal integer
    this.p_img = img;		// Image: string or array of strings
    this.p_file = file;		// File name: string or array of strings
    this.p_apg = apg;		// apg search name: string or undefined
    this.p_name = name;		// Pattern name: string or array of strings
    this.p_cid = cid;		// Category number: enum
    this.p_minp = minp;		// Minimum population: integer
    this.p_maxp = maxp;		// Maximum population: transfinite integer
    this.p_avgp = avgp;		// Average population: transfinite integer (or <0 to count)
    this.p_inf = inf;		// Influence: transfinite integer
    this.p_heat = heat;		// Heat: transfinite integer
    this.p_temp = temp;		// Temperature: real (or <0 to count)
    this.p_vol = vol;		// Volatility: real 0..1 or NaN
    this.p_svol = svol;		// Strict volatility: real 0..1 or NaN
    this.p_symm = symm;		// Symmetry: enum + 10*enum + 100*flags + 1000*(period/modulus) + 10000*osc_flags
    this.p_boxw = boxw;		// Minmal bounding box width: integer
    this.p_boxh = boxh;		// Minimal bounding box height: integer <= boxw
    this.p_lboxw = lboxw;	// Largest bounding box width: transfinite integer
    this.p_lboxh = lboxh;	// Largest bounding box height: transfinite integer <= lboxw
    this.p_hullw = hullw;	// Hull width: transfinite integer
    this.p_hullh = hullh;	// Hull height: transfinite integer <= hullw
    this.p_per = per;		// Period: integer or _
    this.p_gls = gls;		// Gliders: integer (+integer*PAIR/2)
    this.p_freq = freq;		// Frequency: real or NaN
    this.p_tts = tts;		// Time to stabilize: integer or _
    this.p_veld = veld;		// Velocity denominator: integer > 0
    this.p_velx = velx;		// Velocity major: integer
    this.p_vely = vely;		// Velocity minor: integer <= velx
    this.p_nbr = nbr;		// Neighborhood masks: integer (see above)
    this.p_page = page;		// Page number: integer+integer/PAIR
    this.p_hid = hid;		// Header index: integer
}
// Convert a bit mask into a list of digits
function GetBs (n) {
    n = floor (n) % 0x200;
    for (var i = 0, s = ""; i < 9; ++i) {
	if (n & 1 << i) {
	    s += i;
	}
    }
    return s;
}
// Pattern method: Get slope
function p_GetSlope () {
    return this.p_velx? this.p_vely / this.p_velx : NaN;
}
Pattern.prototype.p_GetSlope = p_GetSlope;
// Pattern method: Get required neighborhoods string
function p_GetNbrs () {
    var b = GetBs (this.p_nbrs / 0x40000);
    var s = GetBs (this.p_nbrs / 0x8000000);
    return "B" + GetBs (this.p_nbrs) + (b.length ? "-" + b : "") +
      "S" + GetBs (this.p_nbrs / 0x200) + (s.length ? "-" + s : "");
}
Pattern.prototype.p_GetNbrs = p_GetNbrs;
// Pattern method: Get reverse neighborhood mask (B0>B1>...>B8>S0>S1...>S8)
function p_GetRbn () {
    var rbn = this.p_rbn;
    if (rbn === undefined) {	// Only compute rbn the first time it is actually used
	for (i = rbn = 0, n = this.p_nbr % 0x40000; i < 18; ++i) {
	    rbn |= ((n >> i) & 1) << (17-i);
	}
	this.p_rbn = rbn;
    }
    return rbn;
}
Pattern.prototype.p_GetRbn = p_GetRbn;
// Pattern method: Get apg search name
function p_GetApg (r, old) {
    var apg = this.p_apg;
    if (apg === undefined) {	// Only compute apg search name the first time it is actually used
	var m = this.p_per / this.p_GetRmod ();	// Modulus
	if (this.p_cid >= O_WS && this.p_cid !== O_CONS ||	// Growing patterns and methuselahs are excluded
	    this.p_lboxw >= OMEGA ||		// Growing constellations are excluded
	    this.p_img === HUGEPAT) {		// Huge patterns are excluded
	    apg = "xp0";			// Default to "pattern" category
	    m = 1;				// Period is irregular; only look at first image.
//	    return this.p_apg = "";		// (The few that aren't already have hard-coded APG strings)
	} else if (this.p_velx || this.p_cid === O_SS || this.p_cid === O_PSS) {	// Spaceships are "xq" + period
	    apg = "xq" + this.p_per;
	} else if (this.p_per === 1 || this.p_cid === O_STILL || this.p_cid === O_PSTILL) {	// Still lifes are "xs" + population (including empty universe)
	    apg = "xs" + this.p_minp;
	} else {				// Oscillators are "xp" + period
	    apg = "xp" + this.p_per;
	}
	var e = "";				// Encoding
	var img = this.p_img;			// Library image
	if (IsArray (img)) {			// Try all images
	    for (var i = 0; i < img.length && i < m; ++i) {
		var f = Lib2Bin (img[i], this.p_minp, _, _, 2);
		if (f) {
		    e = BestApg (e, Bin2Apgs (Lib2Bin (img[i], this.p_minp, _, _, 2)));
		}
	    }
	} else {				// Use the only image
	    f = Lib2Bin (img, this.p_minp, _, _, 2);
	    if (f) {
		e = Bin2Apgs (Lib2Bin (img, this.p_minp, _, _, 2));
	    }
	}
//	this.p_apg = apg = e.length ? apg + "_" + e : "";
	this.p_apg = apg = apg + "_" + (e || "0");		// Vacuum is xs0_0
    }
    return apg;
}
Pattern.prototype.p_GetApg = p_GetApg;
// Pattern method: Get LIS string
function p_GetLis (r) {
    var lis = this.p_lis;
    if (lis === undefined) {
	lis = "";
	var p = this.p_img;
	if (p) {
	    if (IsArray (p)) {
		p = p[0];
	    }
	    if (p !== HUGEPAT) {
	        lis = String.fromCharCode (A_SP + (min (this.p_per, 65503) || 0)) +
		      String.fromCharCode (A_SP + (min (this.p_minp, 65503) || 0));
		for (var i = 0; i < p.length; ++i) {
		    var j = p.charCodeAt (i);
		    if (j < 0x60) {
			lis += p[i];
		    } else {
			for (j -= 0x5E; --j >= 0; ) {
			    lis += " ";
			}
		    }
		}
	    }
	}
	this.p_lis = lis;
    }
    return lis;
}
Pattern.prototype.p_GetLis = p_GetLis;
// Pattern method: Get HRD string
// Pattern method: Get hrd
function p_GetHrd (r, old) {
    var hrd = this.p_hrd;
    if (hrd === undefined) {	// Only compute hrd the first time it is actually used
	if (this.p_cid >= O_WS && this.p_cid !== O_CONS ||	// Growing patterns and methuselahs are excluded
	    this.p_velx ||			// Moving patterns are excluded
	    this.per !== 1 ||			// Oscillators should already have hrd supplied!
	    this.p_lboxw >= OMEGA ||		// Growing constellations are excluded
	    this.p_img === HUGEPAT) {		// Huge patterns are excluded
	    hrd = "";				// No rotor
	} else {				// Still lifes have default empty rotor
	    hrd = "p1 r0 0x0";
	}
	this.p_hrd = hrd;
    }
    return hrd;
}
Pattern.prototype.p_GetHrd = p_GetHrd;
// Pattern method: Get SOF name
function p_GetSof (r) {
    var sof = this.p_sof;
    if (sof === undefined) {	// Only compute SOF name the first time it is actually used
	var img = this.p_img;			// Library image
	if (this.p_minp === 0 ||		// Empty universe is deliberately excluded
	  this.p_cid >= O_WS && this.p_cid !== O_CONS && this.p_cid !== O_ANY ||	// Growing patterns and methuselahs are excluded
	  this.p_lboxw >= OMEGA ||		// Growing constellations are excluded
	  img === HUGEPAT) {			// Huge patterns are excluded
	    return this.p_sof = "";
	}
	if (IsArray (img)) {			// Try all images
	    sof = "";
	    var m = this.p_per / this.p_GetRmod ();	// Modulus
	    for (var i = 0; i < img.length && i < m; ++i) {
		var f = Lib2Bin (img[i], this.p_minp, _, _, 2);
		if (f && f.f_minp === this.p_minp) {	// Only consider smallest population
		    sof = BestSof (sof, Bin2Sofs (f));
		}
	    }
	} else {				// Use the only image
	    f = Lib2Bin (img, this.p_minp, _, _, 2);
	    if (f) {
		sof = Bin2Sofs (f);
	    }
	}
	this.p_sof = sof;
    }
    return sof;
}
Pattern.prototype.p_GetSof = p_GetSof;
// Pattern method: Get SOF category URL
function p_GetSofCat () {
    var url = "" + this.p_minp;				// All show population
    if (this.p_per > 1 || this.p_velx) {		// All but still show period
	url += "P" + this.p_per;
    }
    if (this.p_velx) {					// Moving patterns show velocity
	url += "H" + (this.p_velx*this.p_per/this.p_veld) +
	       "V" + (this.p_vely*this.p_per/this.p_veld);
    }
    if (this.p_maxp >= OMEGA) {				// Growing patterns show growth rate
	url += "A" + OrderPair (this.p_maxp, this.p_per)[0];	// (this will never be shown, however)
    }
    return url_pentobj + url + ".1&level=0";
}
Pattern.prototype.p_GetSofCat = p_GetSofCat;
// Pattern method: Get Catagolue URL
function p_GetGol (r) {
    var apg = this.p_GetApg (r, 1);
    return apg.length ? url_obj + apg + (r !== R_ANY ? "/" + ApgEpp (rulerle[r]) : "") : "";
}
Pattern.prototype.p_GetGol = p_GetGol;
// Pattern method: Get URL to common object section
function p_GetCom (r) {
    return r===R_B3S23 && this.p_freq ? this.p_per > 2 ? url_comosc : url_comp1 : "";
}
Pattern.prototype.p_GetCom = p_GetCom;
// Pattern method: Get Pentadecathlon object URL
function p_GetPent (r) {
    var sof = this.p_GetSof (r);
    return sof.length ? url_sof + encodeURIComponent (sof + ".") : "";
}
Pattern.prototype.p_GetPent = p_GetPent;
// Pattern method: Get first file name
function p_GetFile () {
    return GetFirst (this.p_file);
}
Pattern.prototype.p_GetFile = p_GetFile;
// Pattern method: Get all file names as a user-readable string
function p_GetFiles () {
    return JoinArray (this.p_file, "; ");
}
Pattern.prototype.p_GetFiles = p_GetFiles;
// Pattern method: Get all pattern names as a user-readable string
function p_GetNames () {
    return JoinArray (this.p_name, "; ");
}
Pattern.prototype.p_GetNames = p_GetNames;
// Pattern method: Get all wiki names as a user-readable string
function p_GetWiki () {
    return JoinArray (this.p_wiki, "; ");
}
Pattern.prototype.p_GetWiki = p_GetWiki;
// Pattern method: Get file directory
function p_GetDir (dir) {
    var n = GetDirn (dir, false);
    if (isNaN (n) || n >= LG) {		// All patterns 35+ bits are in bucket "lg"
	n = "lg";			// (and all smaller patterns are in size-numbered sections)
    } else if (n < 10) {		// All patterns below 10 bits are in bucket "0"
	n = "0";
    }
    return n;
}
Pattern.prototype.p_GetDir = p_GetDir;
// Pattern method: Get URL to primary file
function p_GetLocal (r) {
    return this.p_hid < 0 ? "" : LocalFile (r,
      this.p_GetDir (rulelib[r][this.p_hid].h_sub), this.p_GetFile ());
}
Pattern.prototype.p_GetLocal = p_GetLocal;
// Pattern method: Get symmetry class
function p_GetSymm () {
    return this.p_symm % 10;
}
Pattern.prototype.p_GetSymm = p_GetSymm;
// Pattern method: Get symmetry parity; return stock result for empty field
function p_GetPar (p, z) {
    return floor (this.p_symm/100%10) & 8 ? z :
      p + (4 >> ((this.p_boxw&1) + (this.p_boxh&1)));
}
Pattern.prototype.p_GetPar = p_GetPar;
// Pattern method: Get glide symmetry class
function p_GetGlide () {
    return floor (this.p_symm % 100 / 10);
}
Pattern.prototype.p_GetGlide = p_GetGlide;
// Pattern method: Get relative modulus, i.e. period/modulus
function p_GetRmod () {
    return floor (this.p_symm % 10000 / 1000);
}
Pattern.prototype.p_GetRmod = p_GetRmod;
// Pattern method: Get oscillator flags
function p_GetFlags () {
    return floor (this.p_symm / 10000);
}
Pattern.prototype.p_GetFlags = p_GetFlags;
// Pattern method: Get raging river
function p_GetRaging () {
    var i;
    return (i = this.p_GetRwidth ()) >= 1 && i <= 2 &&
	   (i = this.p_GetRheight ()) >= 1 && i <= 2;
}
Pattern.prototype.p_GetRaging = p_GetRaging;
// Pattern method: Get evolutionary factor
function p_GetEf () {
    return this.p_minp ? this.p_tts / this.p_minp : 0;
}
Pattern.prototype.p_GetEf = p_GetEf;
// Pattern method: Get rotor width
// (0 for still; undefined for moving or expanding patterns)
function p_GetRwidth () {
    return this.p_velx || this.p_hullw >= OMEGA ? NaN : this.per !== 1 ? this.p_rboxw : 0;
}
Pattern.prototype.p_GetRwidth = p_GetRwidth;
// Pattern method: Get rotor height
// (0 for still; undefined for moving or expanding patterns)
function p_GetRheight () {
    return this.p_velx || this.p_hullw >= OMEGA ? NaN : this.per !== 1 ? this.p_rboxh : 0;
}
Pattern.prototype.p_GetRheight = p_GetRheight;
// Pattern method: Get active cells
// (0 for still; undefined for moving or expanding patterns)
function p_GetAct () {
    return this.p_velx || this.p_hullw >= OMEGA ? NaN : this.per !== 1 ? this.p_act : 0;
}
Pattern.prototype.p_GetAct = p_GetAct;
// Pattern method: Get number of rotors (0 for still; undefined for moving or expanding patterns)
function p_GetNrotors () {
    return this.p_velx || this.p_hullw >= OMEGA ? NaN : this.per !== 1 ? this.p_nrotors || 1 : 0;
}
Pattern.prototype.p_GetNrotors = p_GetNrotors;
// Pattern method: Get RLE comment for export
function p_GetComm () {
    var comm = this.p_comm;		// Comment exported to RLE file
    if (comm === undefined) {		// Comment is not defined for library items
	comm = AddComment (this.p_GetNames ());
    }
    return comm;
}
Pattern.prototype.p_GetComm = p_GetComm;
// Pattern method: Get meaning of unknown value (0=unknown, 1=N/A)
function p_U () {
    return this.p_cid === O_METH;
}
Pattern.prototype.p_U = p_U;
// Generate all orientations of a pattern
function Xforms (f, w, h, dx, dy, l, t, r, b, wild) {
    var flip = h === w || wild < 0;		// Can flip square patterns
    var xform = new Array (flip ? 8 : 4);	// apg search patterns don't encode size
    xform[0] = Bin2Lib (f, t*dy+l*dx, dx, dy, w, h, wild);
    xform[1] = Bin2Lib (f, t*dy+(r-1)*dx, -dx, dy, w, h, wild);
    xform[2] = Bin2Lib (f, (b-1)*dy+l*dx, dx, -dy, w, h, wild);
    xform[3] = Bin2Lib (f, (b-1)*dy+(r-1)*dx, -dx, -dy, w, h, wild);
    if (flip) {
	xform[4] = Bin2Lib (f, t*dy+l*dx, dy, dx, h, w, wild);
	xform[5] = Bin2Lib (f, t*dy+(r-1)*dx, dy, -dx, h, w, wild);
	xform[6] = Bin2Lib (f, (b-1)*dy+l*dx, -dy, dx, h, w, wild);
	xform[7] = Bin2Lib (f, (b-1)*dy+(r-1)*dx, -dy, -dx, h, w, wild);
    }
    return xform;
}
// Generate all orientations of a pattern in library format, and calculate its symmetry
// BUG: Eliminating redundant reflections may not be appropriate if velocity is nonzero!
function Symm (f, l, t, r, b, wild) {
    var x;			// List of transformations
    this.y_wid = r - l;		// Pattern width
    this.y_hgt = b - t;		// Pattern height
    var fold = this.y_wid !== this.y_hgt && wild >= 0;	// Fold in half?
    if (this.y_wid < this.y_hgt) {	// Tall and narrow: flip on its side
	this.y_wid = b - t;
	this.y_hgt = r - l;
	x = Xforms (f, this.y_wid, this.y_hgt, f.f_wid, 1, t, l, b, r, wild);
    } else {
	x = Xforms (f, this.y_wid, this.y_hgt, 1, f.f_wid, l, t, r, b, wild);
    }
    this.y_symm = Y_C1;			// Symmetry class
    if (x[0] === x[1]) {
	if (x[0] !== x[2]) {		// Orthogonal |
	    this.y_symm = Y_D2P;
	    x = fold ? [x[0], x[2]] : [x[0], x[2], x[4], x[6]];
	} else if (x[0] !== x[4]) {	// Orthogonal | -
	    this.y_symm = Y_D4P;
	    x = fold ? x[0] : [x[0], x[4]];
	} else {			// 8-way
	    this.y_symm = Y_D8;
	    x = x[0];
	}
    } else if (x[0] === x[2]) {		// Vertical reflection -
	this.y_symm = Y_D2P2;
	x = fold ? [x[0], x[1]] : [x[0], x[1], x[4], x[5]];
    } else if (x[0] === x[3]) {
	if (x[0] === x[4]) {		// Double diagonal \ /
	    this.y_symm = Y_D4X;
	    x = [x[0], x[1]];
	} else if (x[0] === x[5]) {	// 90-degree rotation
	    this.y_symm = Y_C4;
	    x = [x[0], x[1]];
	} else {			// 180-degree rotation
	    this.y_symm = Y_C2;
	    x = fold ? [x[0], x[1]] : [x[0], x[1], x[4], x[5]];
	}
    } else if (x[0] === x[4]) {		// Single diagonal 
	this.y_symm = Y_D2X;
	x = [x[0], x[1], x[2], x[3]];
    } else if (x[0] === x[7]) {		// Single diagonal /
	this.y_symm = Y_D2X2;
	x = [x[0], x[1], x[2], x[3]];
    }					// No symmetry
    this.y_symm += 200*(this.y_wid&1) + 400*(this.y_hgt&1) + 800*(this.y_wid<=0) + 100;
    this.y_img = x;			// List of unique images, or single image
}
//------------------------------ DOM-accessing primitives ----------------------
// Convert a named HTML object (id="id") into the actual object, if necessary
function Id (id) {
    ID = id;
    if (IsString (id) && !document.getElementById (id)) {	// @@@
	alert ("Id ( " + id + " )");
    } else if (!id) {
	alert ("ID [ " + id + " ]");
    }
    return IsString (id) ? document.getElementById (id) : id;
}
// Basic HTML element methods: most can be accessed by object or id
function Reset (id) { Id (id).reset (); }		// Reset an input form
function Select (id) { Id (id).select (); }		// Select all text a specific text element
function Focus (id) { Id (id).focus (); }		// Set focus to a specific form element
function SetText (id, str) { Id (id).childNodes[0].nodeValue = str; }	// Set element's text
function SetHref (id, url) { Id (id).href = url; }	// Set <a> tag's referring URL
function SetTarget (id, target) { Id (id).target = target; }	// Set <a> tag's target window
function SetDownload (id, dl) { Id (id).download = dl; }	// Set HTML element's download name (if the browser supports it)
function GetValue (id) { return Id (id).value; }	// Get form element's value
function SetValue (id, value) { Id (id).value = value; }	// Set form element's value
function GetOtext (id) { return Id (id).text; }		// Get option element's text
function SetOtext (id, value) { Id (id).text = value; }	// Set option element's text
function SetMax (id, max) { Id (id).max = max; }	// Set progress bar's maximum limit
function SetRows (id, n) { Id (id).rows = n; }		// Set multiline text box's height
function GetChecked (id) { return Id (id).checked; }	// Get checkbox's check status
function SetChecked (id, c) { Id (id).checked = c; }	// Set checkbox's check status
function SetIndeterminate (id, i) { Id (id).indeterminate = i; }	// Set checkbox's indeterminate status (HTML 5 only)
function GetSel (id) { return Id (id).selectedIndex; }	// Get selection control's selected index
function SetSel (id, i) { Id (id).selectedIndex = i; }	// Set selection control's selected index
function GetOptions (id) { return Id (id).options; }	// Get select control's options
function SetColSpan (id, span) { Id (id).colSpan = "" + span; }	// Set table cell's number of spanning columns
function GetContext (id, type) { return (id = Id (id)).getContext && id.getContext (type); }	// Get canvas drawing context (or undefined if canvas is not supported)
function SetWidth (id, width) { Id (id).setAttribute ("width", width + "px"); }	// Set element's width
function SetHeight (id, height) { Id (id).setAttribute ("height", height + "px"); }	// Set element's height
function SetClass (id, c) { Id (id).setAttribute ("class", c); }	// Set element's class
function GreyText (id, enable) { Id (id).style.color = enable ? C_TEXT_NORMAL : C_TEXT_DISABLE; }	// Set element's color to grey or black, to indicate disabled/enabled state
function Enable (id, enable) { Id (id).disabled = !enable; }	// Enable form input control
function SetReadOnly (id, ro) { Id (id).readOnly = ro; }	// Set element's read-only attribute
function SetBg (id, bg) { Id (id).style.backgroundColor = bg; }	// Set element's background color
function SetLeft (id, x) { Id (id).style.left = x + "px"; }	// Set element's left position
function SetTop (id, y) { Id (id).style.top = y + "px"; }	// Set element's top position
function SetBold (id, bold) { Id (id).style.fontWeight = bold ? "bold" : ""; }	// Set element's font weight to bold, or not
function ShowB (id, show) { Id (id).style.display = show ? "block" : "none"; }	// Show or hide block element (but not <p> or <table>)
function ShowI (id, show) { Id (id).style.display = show ? "inline" : "none"; }	// Show or hide inline element
function ShowR (id, show) { Id (id).style.display = show ? "table-row": "none"; }	// Show or hide table row (i.e. <tr>) element
function GreyC (id, col, show) { ShowI (id, show); SetBg (col, show ? C_BG : C_BG_GREY); }	// Grey table cell (i.e. <td>) element
function GetCells (id) { return Id (id).cells; }	// Get table row's (<tr>) cells
function GetRows (id) { return Id (id).rows; }	// Get table control's (<table>) rows
function CreateElement (t) { return document.createElement (t); }	// Create DOM element
function TextNode (s) { return document.createTextNode (s); }		// Create a text node
function AddChild (id, a) { Id (id).appendChild (a); }	// Add a child element
function DrawImage (ctx, id, sx, sy, sw, sh, dx, dy, dw, dh) { ctx.drawImage (Id (id), sx, sy, sw, sh, dx, dy, dw, dh); }	// Copy a piece of one canvas to another
function DrawRect (ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect (x, y, w, h); }	// Draw a filled solid rectangle on a canvas
// Create an anchor element
function CreateAnchor (url, target, c) {
    var a = CreateElement ("a");
    SetClass (a, c);
    SetHref (a, url);
    if (target && url.substring (0, js.length) !== js) {
	SetTarget (a, target);
    }
    return a;
}
// Embed context in URL, if necessary
function AddAnchor (td, url, target, c) {
    if (url) {					// Add URL, if necessary
	var a = CreateAnchor (url, target, c)
	AddChild (td, a);
	return a;
    }
    return td;
}
// Add a canvas element to a table cell
function AddCanvas (td, url, target, width, height) {
    td = AddAnchor (td, url, target, "j");
    var c = CreateElement ("canvas");
    c.width = "" + width;
    c.height = "" + height;
    AddChild (td, c);;
    return c;
}
// Reuse a cell in an HTML table row. If it doesn't already exist, create it.
// If it exists, remove all its contents
function ReuseCell (tr, x) {	// Table row element is ALWAYS anonymous
    var td = x < tr.cells.length ? tr.cells[x] : tr.insertCell (x);
    while (td.childNodes.length > 0) {
	td.removeChild (td.childNodes[td.childNodes.length-1]);
    }
    SetBg (td, C_BG);
    return td;
}
// Reuse a row in an HTML table. If it doesn't already exist, create it.
// (Vertical scrolling is jumpy if table contents are cleared and recreated; this reduces that.)
function ReuseRow (tab, y) {
    return y < (tab = Id (tab)).rows.length ? tab.rows[y] : tab.insertRow (y);
}
// Remove trailing cells from an HTML table row by reference
function TruncRow (tr, n) {
    while (tr.cells.length && tr.cells.length > n) {
	tr.deleteCell (tr.cells.length-1);
    }
}
// Remove trailing rows from an HTML table by reference
function TruncTable (tab, n) {
    for (tab = Id (tab); tab.rows.length && tab.rows.length > n; ) {
	tab.deleteRow (tab.rows.length-1);
    }
}
// Add an option element to a select list
function AddOption (s, text, value) {
    var o = CreateElement ("option");
    o.text = text;
    SetValue (o, value === undefined ? text : value);
    Id (s).add (o, null);
}
// Remove trailing options from a select list
function TruncOptions (sel, n) {
    for (sel = Id (sel); sel.length > n; ) {
	sel.remove (sel.length - 1);
    }
}
// Get window aperture size
function GetAperture () {
//    if (window.innerWidth !== undefined) {			// Preferred method
//	return [window.innerWidth, window.innerHeight];
//    } else {							// Alternate method
	var b = Id ("body");
	return [b.clientWidth, b.clientHeight];
//    }
}
// Get current window scroll position
function GetScroll () {
    if (window.pageXOffset !== undefined) {			// Preferred method
	return [window.pageXOffset, window.pageYOffset];
    } else {							// Alternate method
	var b = document.documentElement || document.body;	// Document element object
	return [b.scrollLeft, b.scrollTop];
    }
}
// Force an object to fit on the screen
function FitObj (id, xy) {
    var obj = Id (id);					// object
    var w = GetScroll ();				// left, top coordinates of window aperture
    var wh = [obj.offsetWidth, obj.offsetHeight];	// object size
    for (var i = 0; i < 2; ++i) {
	xy[i] = max (min (xy[i], w[i] + aperture[i] - wh[i]), w[i]);
    }
    SetLeft (obj, xy[0]);
    SetTop (obj, xy[1]);
}
// Calculate absolute mouse position on screen.
function MouseAbs (e) {
    if (e.pageX || e.pageY) {			// Preferred method
	return [e.pageX, e.pageY];
    } else if (e.clientX || e.clientY) {	// Alternate method
	var b = document.documentElement || document.body;	// Document element object
	return [e.clientX + G.scrollLeft, e.clientY + G.scrollTop];
//	return [e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
//		e.clientY + document.body.scrollTop + document.documentElement.scrollTop];
    } else {
	return [0, 0];
    }
}
// Calculate an object's position relative to the page
function ObjRel (obj) {
    var x = 0;
    var y = 0;
    while (obj.offsetParent) {
	x += obj.offsetLeft;
	y += obj.offsetTop;
	obj = obj.offsetParent;
    }
    return [x, y];
}
// Calculate mouse position relative to the control being acted upon
// Much of the convolution here is as a result of two things:
// 1) canvas does not provide a simple object-relative mouse position; one must
//    determine mouse position with respect to some other context
// 2) Different browsers support different properties, and no method works for all. Sigh.
function MouseRel (e) {
    e = e || window.event;
    var xy = MouseAbs (e);
    var obj = ObjRel (e.target || event.srcElement);	// DOM object coordinate is relative to
    return [xy[0]-obj[0], xy[1]-obj[1]];
}
//------------------------------ Array, number, and string primitives ----------
// Simple converters and predicates
function SmartQuote (s) { return s; }		// Don't convert apostrophes in pattern name to smart quotes
var psquo = new RegExp ("[" + Ulsquo + Ursquo + "]", "g");
var pdquo = new RegExp ("[" + Uldquo + Urdquo + "]", "g");
function DumbQuote (s) { return s.replace (psquo, "'").replace (pdquo, "\""); }	// Convert smart quotes into ASCII quotes
function IsNumber (s) { return "number" === typeof s; }		// Is a variable a number?
function IsString (s) { return "string" === typeof s; }		// Is a variable a string?
function IsFunction (s) { return "function" === typeof s; }	// Is a variable a function?
function IsArray (s) { return Array.isArray (s); }		// Is a variable an array?
function GetFirst (a) { return IsArray (a) ? a[0] : a; }	// Get first item from an array, or a non-array atom
function JoinArray (a, j) { return IsArray (a) ? a.join (j) : a; }	// Join elements of an array together, or return a non-array atom
// Find index of NaN in a list, or -1 if not there
// This works like array.indexOf/In, but it must be separate, because NaN !== NaN
function InNaN (list) {
    for (var i = 0; i < list.length; ++i) {
	if (isNaN (list[i])) {
	    return i;
	}
    }
    return -1;
}
// Compute gamma function of a real number x (i.e. (x-1)!)
function Gamma (x) {
    if (isNaN (x)) {			// Nan! = Nan
	return x;
    }
    var i = x === round (x);		// Pure integer?
    if (i && x <= 0) {			// Singularities at negative integers
	return _;
    }
    var z = 1;
    while (x <= 0) {			// Constrain x to 0 < x
	if ((z *= x++) === _) {		// Calculating reciprocal reduces division errors
	    return 0;
	}
    }
    z = 1/z;
    while (x > 1) {			// Constrain x to x < 1
	if ((z *= --x) === _) {
	    return z;
	}
    }
    if (!i) {				// Polynomial calculates 1/Gamma (x), 0<x<1
	var p = 0;
	for (i = gpoly.length; --i >= 0; ) {
	    p = p*x + gpoly[i];
	}
	z /= p;
    }
    return z;
}
// Split (possibly transfinite) number into [multiplier, order of magnitude]
// Magnitude is scaled by period^order, to make sure it is in a reasonable range
// (but this scaling is not done if !order, or if period is infinite or indeterminate)
function OrderPair (n, q) {
    if (n < OMEGA) {			// Real is stored as-is
	return [n, 0];
    } else {				// Transfinite is cached
	var o = transord[n -= OMEGA];
	return [transval[n] / (isNaN (q) || q === _ ? 1 : Pow (q, o)), o];
    }
}
// Return (possibly transfinite) number as a real number
// ?*t^n is treated as infinite, rather than indeterminate (and ?/t is treated as 0)
function OrderNum (n) {
    n = OrderPair (n, 1);
    return n[1] ? n[1]>0 ? _ : 0 : n[0];
}
// Add two (possibly transfinite) numbers
function OrderAdd (x, y) {
    var u = OrderPair (x, 1);
    var v = OrderPair (y, 1);
    return u[1] < v[1] ? y : u[1] > v[1] ? x : CacheOrder (u[0] + v[0], u[1]);
}
// Multiply two (possibly transfinite) numbers
function OrderMul (x, y) {
    var u = OrderPair (x, 1);
    var v = OrderPair (y, 1);
    return CacheOrder (u[0] * v[0], u[1] + v[1]);
}
// Divide two (possibly transfinite) numbers
// By convention, (n/?)*w^p is treated as ?*w^(p-1)
function OrderDiv (x, y) {
    var u = OrderPair (x, 1);
    var v = OrderPair (y, 1);
    return CacheOrder (u[0]/v[0], u[1] - v[1] - (isNaN(v[0]) && !isNaN(u[0])));
}
// Add two numbers. Edge case _+-_ returns 0, rather than NaN
// (Subtract by adding the negative.)
function Add (x, y) {
    var r = x + y;
    return isNaN (r) && !isNaN (x) && !isNaN (y) ? 0 : r;
}
// Multiply two numbers. Edge case 0*_ returns 0, rather than NaN
function Mul (x, y) {
    var r = x * y;
    return isNaN (r) && !isNaN (x) && !isNaN (y) ? 0 : r;
}
// Divide two numbers. Edge cases 0/0 and _/_ return 1, rather than NaN
function Div (n, d) {
    return n !== d ? n !== -d ? n/d : -1 : 1;
}
// Raise one number to the power of another.
// Handles edge cases: 1^_ = 1^-_ = 1^NaN = 1.
// Also, x^_=0 (where -1<x<0) and x^-_ (where x<-1).
// pow correctly handles edge case: NaN^0 = 1.
// The following case could give better results:
//   -x ^ ((2p+1)/q) (where 0 < x, integer p,q) = -(x ^ ((2p+1)/q))
// pow returns NaN for this.
// However, we"re not really concerned with such minute details,
// as they could only occur in user expressions.
// After all, this is a search form, not a universal desk calculator.
function Pow (x, y) {
    return x !== 1 ? y === _ && abs (x) < 1 ||
      y === -_ && abs (x) > 1 ? 0 : pow (x, y) : 1;
}
// Tolerantly compare two numbers for equality. Also, NaN === NaN.
// This is forgiving of errors caused by rounding.
// (This uses the same criterion used by the J programming language comparisons)
function Eq (x, y, ct) {
    var scale = max (abs (x), abs (y));
    return isNaN (x) && isNaN (y) || x === y ||
      scale !== _ && abs (x-y) <= scale*ct;
}
// Tolerant floor
function Floor (x, ct) {
    var r = round (x);
    return r - (r > x && !Eq (r, x, ct));
}
// Tolerant ceiling
function Ceil (x, ct) {
    var r = round (x);
    return r + (r < x && !Eq (r, x, ct));
}
// Calculate residue. This is like modulus, but always nonnegative.
// It also uses comparison tolerance.
function Residue (n, d, ct) {
    var q = n / d;				// Raw quotient
    var w = Floor (q, ct);			// Whole part: (q-w)*d is raw residue
    return (Ceil (q, ct) !== w) * (n - d*w);
}
// Get low half of a pair of numbers (high half is floor (x))
function Lowpart (x) {
    return x*PAIR % PAIR;
}
// Compute GCD of two integers using Euclid's algorithm. Comparisons are tolerant.
// (NOTE: This also works for _ and NaN. Since this is only used for
//  integer periods on the stamp page, no special handling is needed for reals.)
function GCD (x, y, ct)
{
    x = abs (x);
    y = abs (y);
    if (isNaN (x) || isNaN (y)) {	// GCD (x, NaN) = GCD (NaN, y) = NaN
	return NaN;
    } else if (x === y || x === 0 || x === _) {	// GCD (n, n) = GCD (0, n) = GCD (_, n) = n
	return y;			// (even if n is 0 or _)
    } else if (y === _) {		// GCD (n, 0) = GCD (n, _) = n
	return x;			// (even if n is 0 or _)
    }
    while (y) {
	var z = Residue (x, y, ct);
	x = y;
	y = z;
    }
    return x;
}
// Compute LCM of two integers. Comparisons are tolerant.
// This handles the following edge conditions:
//	LCM (0, 0) = 0; LCM (_, _) = _; (and implicitly, LCM (NaN, NaN) = NaN)
function LCM (x, y, ct) {
   return x === y ? x : x / GCD (x, y, ct) * y;
}
// Convert a real number into rational form. Comparisons are tolerant.
// Real number is converted into a continued fraction via Euclid's GCD algorithm
// Caller handles edge conditions like _ and NaN and negative numbers
// (NOTE: This does not work well with really huge denominators!)
function Rational (f, ct) {
    var c = [];				// f=c[0]+1/(c[1]+1/(...+1/(c[n-1])))
    var n = 0;
    var z;
    for (; n < NCF; f = 1/z) {		// Compute continued fraction
	z = Residue (f, 1, ct);
	c[n++] = f - z;
	if (!z) {
	    break;
	}
    }
    var u = c[--n];			// Result is u/v
    var v = 1;
    while (--n >= 0) {			// For each term, u/v = (c[n]/1) + (v/u)
	z = u * c[n] + v;
	v = u;
	u = z;
    }
    return [round (u), round (v)];
}
// Parse a string into a number, for system data.
// Empty string is treated as the default value (which is usually 0).
// This permits floats, rational numbers, infinities, and indefinites.
// This is much less functional than ParseUfloat, and should run much faster.
// Allows characters _ (infinity) and ? (indefinite), and infix operator / (division).
function ParseSfloat (str, def) {
    var i = str.lastIndexOf ("/");		// x / y (NOTE: / y => 1 / y)
    if (i >= 0) {
	return ParseSfloat (str.substring (0, i), 1) / ParseSfloat (str.substring (i+1), 1);
    } else if (str === "_") {			// Infinity
	return _;
    } else {					// "normal" real number
	return isNaN (i = parseFloat (str)) && str !== "?" ? def : i;
    }
}
// Parse a string into a number, for user-entered data. Spaces are ignored.
// Also allow empty strings for default value.
// Allow characters: _ ? x infinity (and words: inf infinity unknown nan)
// Allow suffix characters: 1/4 1/2 3/4 ^1 ^2 ^3 ! e pi tau phi (and words: pi tau phi)
// Allow infix characters: * / ^ times divide sqrt (and words: sqrt root)
// Allow infix characters: + - (except after e, e.g. 1.2e+3 is 1.2*(10^3) not (1.2*e)+3)
function ParseUfloat (str, nan, def) {
    var i;
    str = str.replace (eThousands, "").replace (eDecimal, ".");	// Remove spaces; localize
    for (i = keywords.length; --i >= 0; ) {	// Translate keywords
	str = str.replace (keywords[i], keychars[i]);
    }
    var i = str.lastIndexOf ("+");		// x + y (also + y => 1 + y)
    if (i >= 0 && (i <= 1 || str[i-1] !== "e")) {
	return Add (ParseUfloat (str.substring (0, i), nan, 0),
	  ParseUfloat (str.substring (i+1), nan, 0));
    }
    i = str.lastIndexOf ("-");			// x - y (also - y => 0 - y)
    if (i >= 0 && (i <= 1 || str[i-1] !== "e")) {
	return Add (ParseUfloat (str.substring (0, i), nan, 0),
	  -ParseUfloat (str.substring (i+1), nan, 0));
    }
    i = max (str.lastIndexOf ("*"), str.lastIndexOf (Utimes));
    if (i >= 0) {				// x * y (also * y => 1 * y)
	return Mul (ParseUfloat (str.substring (0, i), nan, 1),
	  ParseUfloat (str.substring (i+1), nan, 1));
    }
    i = max (str.lastIndexOf ("/"), str.lastIndexOf (Udivide));
    if (i >= 0) {				// x / y (also / y => 1 / y)
	return Div (ParseUfloat (str.substring (0, i), nan, 1),
	  ParseUfloat (str.substring (i+1), nan, 1));
    }
    i = str.lastIndexOf ("^");			// x ^ y (also ^ y => e * y)
    if (i >= 0) {
	return Pow (ParseUfloat (str.substring (0, i), nan, E),
	  ParseUfloat (str.substring (i+1), nan, 1));
    }
    i = str.lastIndexOf (Uradic);		// x root y (also root y => 2 root y)
    if (i >= 0) {
	return Pow (ParseUfloat (str.substring (i+1), nan, 1),
	  1 / ParseUfloat (str.substring (0, i), nan, 2));
    }
    if (str === "") {				// Empty string: default value
	return def;
    } else if (str === "_" || str === Uinf) {	// Infinity
	return _;
    } else if (str === "?" || str === "x") {	// Unknown
	return nan;
    } else if ((i = suffc.indexOf (str[str.length-1])) >= 0) {
	var j = suffn[i];
	str = str.substring (0, str.length-1);
	if (i < 3) {		// n 1/4 (also 1/4 => 0 1/4); also 1/2 3/4
	    return ParseUfloat (str, nan, 0) + j;
	} else if (i < 6) {	// n ^1 (also ^1 => e ^1); also ^2 ^3
	    return Pow (ParseUfloat (str, nan, E), j);
	} else if (i === 6) {	// n ! (also ! => 1 !)
	    return Gamma (1 + ParseUfloat (str, nan, 1));
	} else {		// n pi (also pi => 1 pi); also e tau phi etc.
	    return ParseUfloat (str, nan, 1) * j;
	}
    } else {
	return parseFloat (str);		// "normal" real number
    }
}
// Parse a string into a number, for user-entered data, ignoring case
function ParseLfloat (str, nan) {
    return ParseUfloat (str.toLowerCase (), nan, 0);
}
// Parse a string into a number or string of one or more numbers, ignoring case
function ParseLfloats (str, nan) {
    str = str.replace (/;/g, ",");		// Allow both , and ; as separators
    if (str.indexOf (",") < 0) {		// Single number
	return ParseLfloat (str, nan);
    }
    str = str.split (",");
    for (var i = 0; i < str.length; ++i) {	// Multiple numbers
	str[i] = ParseLfloat (str[i], nan);
    }
    return str;
}
// Compare a file/pattern name, or list of names, against a pattern
function WildCmp (list, pat, p) {
    if (IsArray (list)) {			// list of strings
	for (var i = list.length; --i >= 0; ) {
	    if (WildCmp (list[i], pat, p)) {
		return true;
	    }
	}
	return false;
    } else {
	if (p) {	// Pattern names strip all punctuation except . and $
	    list = list.replace (/[^$.0-9A-Za-z]/g, "");
	}
	return list.search (pat) >= 0;
    }
}
// See if a number matches a selected range
// This supports integers and reals (n/1, x/1, y/1)
// It also supports rationals (n/q, x/d, y/d) to avoid real division rounding errors:
// q!===1 only with s_vels, s_rpops, s_mods, s_boxss, s_lboxss, s_hullss, s_rboxss;
// d!===1 only with s_vels.
// g=0 for most; g=TBD for gliders; g=_ for rarity (for incomparability side-effects)
function MatchNum (n, q, type, x, y, d, g) {
    var i;
    if (IsArray (d)) {			// d is a list of numbers
	if (type === M_EQ) {			// n===y/d0 || n===y/d1 || ...
	    for (i = 0; i < d.length; ++i) {
		if (MatchNum (n, q, type, x, y, d[i], g)) {
		    return true;
		}
	    }
	    return false;
	} else {				// n!===y/d0 && n!===y/d1 && ...
	    for (i = 0; i < d.length; ++i) {
		if (!MatchNum (n, q, type, x, y, d[i], g)) {
		    return false;
		}
	    }
	    return true;
	}
    } else if (IsArray (y)) {			// y is a list of numbers
	if (type === M_EQ) {			// n===y0 || n===y1 || ...
	    for (i = 0; i < y.length; ++i) {
		if (MatchNum (n, q, type, x, y[i], d, g)) {
		    return true;
		}
	    }
	    return false;
	} else {				// n!===y0 && n!===y1 && ...
	    for (i = 0; i < y.length; ++i) {
		if (!MatchNum (n, q, type, x, y[i], d, g)) {
		    return false;
		}
	    }
	    return true;
	}
    } else if (IsArray (x)) {			// x is a list of numbers
	for (i = 0; i < x.length; ++i) {	// x0<=n<=y && x1<=n<=y && ...
	    if (!MatchNum (n, q, type, x[i], y, d, g)) {
		return false;
	    }
	}
	return true;
    } else {
	if (n === q) {				// Treat 0/0 and _/_ as 1
	    n = q = 1;
	}
	switch (type) {				// Types that don't rely on y
	case M_ANY:				// match any
	    return true;
	case M_INF:				// n = Infinity
	    return n === _;
	case M_NAN:				// n = NaN
	    return isNaN (n);
	case M_UNKNOWN:				// n >= "x"
	    return n >= UNKNOWN;
	case M_PARTIAL:				// n > "x"
	    return n > UNKNOWN;
	case M_TBD:				// n === TBD
	    return n === TBD;
	case M_KNOWN:				// n === KNOWN
	    return n === KNOWN;
	}
	if (isNaN (y)) {			// === doesn't work on NaN
	    switch (type) {
	    case M_EQ:				// n === NaN
	    case M_LE:				// n <= NaN
	    case M_GE:				// n >= NaN
		return isNaN (n);
	    case M_NE:				// n !== NaN
		return !isNaN (n);
	    case M_IN:				// x <= n <= NaN
		return isNaN (n) && isNaN (x);
	    case M_OUT:				// n < x || y < n
		return !isNaN (n) || !isNaN (x);
	    }
	} else if (isNaN (n) && !g) {		// ? is treated as unknown large integer
	    switch (type) {
	    case M_NE:				// ? !== y
		return true;
	    case M_LT:				// ? < _
	    case M_LE:				// ? <= _
		return y === _;
	    case M_GT:				// ? > y
	    case M_GE:				// ? >=y
		return y !== _;
	    case M_IN:				// x <= ? <= _
		return x === _ ^ y === _;
	    case M_OUT:				// ? < x || y < ?
		return x === _ ^ y !== _;
	    }
	} else {
	    if (g && (((n >= g) ^ (y >= g)) ||
	      type >= M_IN && ((x >= g) ^ (y >= g)))) {
		return type === M_OUT;		// High values are incomparable
	    }
	    if (n === 0) {			// 0 / anything = 0
		q = 1;
	    } else if (q === 0) {		// anything / 0 = _
		n = _;
		q = 1;
	    } else if (isNaN (n)) {		// ? / anything = ?;
		q = 1;
	    } else if (n === _) {		// _ / anything = _; _ / ? > 1
						// TBD: treat _/? as smaller than _
	    } else if (isNaN (q)) {		// n / ? > n / _
		++n;
		q = _;
	    }
	    n *= d;
	    x *= q;
	    y *= q;
	    switch (type) {
	    case M_EQ:				// n/q === y/d
		return n === y || Eq (n, y, CT);
	    case M_NE:				// n/q !== y/d
		return n !== y && !Eq (n, y, CT);
	    case M_LT:				// n/q < y/d
		return n < y && !Eq (n, y, CT);
	    case M_LE:				// n/q <= y/d
		return n <= y || Eq (n, y, CT);
	    case M_GT:				// n/q > y/d
		return n > y && !Eq (n, y, CT);
	    case M_GE:				// n/q >= y/d
		return n >= y || Eq (n, y, CT);
	    case M_IN:				// x/q <= n/d <= y/q
		return (x <= n || Eq (x, n, CT)) && (n <= y || Eq (n, y, CT)) ||
		       (y <= n || Eq (y, n, CT)) && (n <= x || Eq (n, x, CT));
	    case M_OUT:				// n/d < x/q || y/q < n/d
		return ! ((x <= n || Eq (x, n, CT)) && (n <= y || Eq (n, y, CT)) ||
			 (y <= n || Eq (y, n, CT)) && (n <= x || Eq (n, x, CT)));
	    }
	}
	return false;
    }
}
// See if a (possibly transfinite) number matches a selected range
// (Since transfinites cannot be entered manually, there is no need to pre-screen for orders)
function MatchOrderNum (n, q, type, x, y, d, g) {
    return MatchNum (OrderNum (n), OrderNum (q), type, x, y, d, g);
}
// Compare two strings, similar to C library strcmp
function StrCmp (x, y) {
    var n = min (x.length, y.length);		// Length of common part
    for (var i = 0; i < n; ++i) {
	var u = x.charCodeAt (i);
	var v = y.charCodeAt (i);
	if (u !== v) {
	    return u - v;			// Difference in characters
	}
    }
    return x.length - y.length;			// Empty string < non-empty string
}
// Choose most canonical apg search representation. The shortest string is always chosen,
// and if there are more than one, the earliest one in ASCII order is chosen.
// Empty strings are always ignored, if possible.
function BestApg (a, b) {
    var n = a.length;
    var i = b.length;
    if (n === 0 || i < n) {
	return b;
    }
    if (i === 0 || n < i) {
	return a;
    }
    return StrCmp (a, b) < 0 ? a : b;
}
// Choose most canonical SOF name representation.
// The latest one in ASCII order is chosen.
// Empty strings are always ignored, if possible, but that is implied.
function BestSof (a, b) {
    return StrCmp (a, b) < 0 ? b : a;
}
// Compare two strings, similar to C library strcmp, but treating integers as
// atomic; e.g. "8.3" < "12.2" < "12.10"
// Also, case is ignored
function NumStrCmp (x, y) {
    var n = min (x.length, y.length);		// Length of common part
    for (var i = 0; i < n; ++i) {
	var u = x.charCodeAt (i);
	var v = y.charCodeAt (i);
	if (u >= A_A && u <= A_Z) {		// Convert to lower-case
	    u |= A_LC;
	}
	if (v >= A_A && v <= A_Z) {		// Convert to lower-case
	    v |= A_LC;
	}
	if (u !== v) {
	    while (i > 0 && (n = x.charCodeAt (i-1)) >= A_0 && n <= A_9) {
		--i;				// Number: find where it started
	    }
	    x = parseInt (x.substring (i));
	    y = parseInt (y.substring (i));
	    if (!isNaN (x) && !isNaN (y)) {	// Difference in numbers
		return x - y;
	    }
	    return u - v;			// Difference in characters
	}
    }
    return x.length - y.length;			// Empty string < non-empty string
}
// Compare two strings or arrays of strings for sorting purposes
function CmpName (x, y) {
    if (IsArray (x)) {
	if (IsArray (y)) {			// x0,x1,... :: y0,y1,...
	    var n = min (x.length, y.length);	// Length of common part
	    for (var i = 0; i < n; ++i) {
		var c = NumStrCmp (x[i], y[i]);
		if (c) {
		    return c;
		}
	    }
	    return x.length - y.length;		// Empty list < non-empty list
	} else {				// x0,x1,... :: y
	    return NumStrCmp (x[0], y) || 1;
	}
    } else {
	if (IsArray (y)) {			// x :: y0,y1,...
	    return NumStrCmp (x, y[0]) || -1;
	} else {				// x :: y
	    return NumStrCmp (x, y);
	}
    }
}
// Compare two pattern images for sorting purposes.
// It is assumed that images are in compressed canonical form. Thus:
// - a space never precedes a space run, or newline, or end of string
// - space runs are always maximum length, if possible (so fronts will match)
// - space runs never precede newline or end of string
// - newlines never precede end of string
function CmpImg (x, xw, xh, y, yw, yh) {
    x = GetFirst (x);				// If multiple images, use the first one
    y = GetFirst (y);
    var i = (xh - yh) || (xw - yw);
    if (i) {					// Sort by box first; this also eliminates
	return i;				// really huge patterns like Gemini.
    }
    var n = min (x.length, y.length);		// Length of common part
    for (i = 2; i < n; ++i) {
	var u = x.charCodeAt (i);		// Bytes from each pattern
	var v = y.charCodeAt (i);
	if (u !== v) {
	    if (u === A_NL) {			// newline < value or space run
		return -1;
	    } else if (v === A_NL) {		// value or space run > newline
		return 1;
	    } else if (u >= A_GRAVE) {		// space run < value
		return -1;
	    } else if (v >= A_GRAVE) {		// value > space run
		return 1;
	    } else {				// value < = > value
		return u - v;
	    }
	}
    }
    return x.length - y.length;			// Empty pattern < non-empty pattern
}
// Compare two numbers for sorting purposes. (n=false when checking for N/A)
// For predictable sorting, NaN=NaN, x<NaN<_<N/A for any finite x
function CmpNum (x, y, n) {
    if (x === y) {		// x = y (avoid _-_ below!)
	return 0;
    } else if (x === _ && n) {	// _ > y or NaN (but not N/A)
	return 1;
    } else if (y === _ && n) {	// x or NaN (but not N/A) < _
	return -1;
    } else if (isNaN (x)) {
	if (isNaN (y)) {	// NaN = NaN
	    return 0;
	} else {		// NaN > y
	    return 1;
	}
    } else {
	if (isNaN (y)) {	// x < NaN
	    return -1;
	} else {		// x < > y
	    return x - y;
	}
    }
}
// Compare two rational numbers for sorting purposes.
// This removes the chance of rounding errors when comparing integers
// (e.g. 25/5 !== 5/1), by comparing xn*yd and yn*xd rather than xn/xd and yn/yd.
// The following cases can occur (* are treated specially)
// - Modulus:		_/(1|2|4)* or period/(1|2|4)
// - Velocity:		n/d
// - Volatility:	NaN/NaN or svol/vol or 0/0*
// - Gliders/bit:	gls/pop or KNOWN/pop* TBD/pop* UNKNOWN[+n]/pop*
// - Maximum box:	n/d or _/d or _/_* or 0/0*
// The following special cases are handled:
// - NaN is treated the same way it is when comparing integers (i.e. 0<NaN<_)
//   (Since the denominators are always at least as predictable as the numerators,
//   one can have NaN/NaN or NaN/d (which both behave predictably), but never n/NaN.)
//   - (Actually, n/NaN CAN now occur; it is treated as 0<n/NaN<1)
// - 0/0 and _/_ are treated as 1
// - Infinities can be relative: i.e. _/x < _/y if x > y
//   (This should now never occur, as any values that could possibly be infinite
//    should use Order numbers)
// - KNOWN/TBD/UNKNOWN gliders ignore population
function CmpRat (xn, xd, yn, yd, g) {
    if (xd === yd) {					// x/d :: y/d => x :: y
	return CmpNum (xn, yn, true);
    } else if (xn === yn) {				// n/x :: n/y => y :: x
	return CmpNum (yd, xd, true);
    } else if (xn === xd) {				// x/x, 0/0, _/_ => 1
	xn = xd = 1;
    } else if (xn === 0 || xd === _) {			// 0/x, x/_ => 0
	xn = 0;
	xd = 1;
    }
    if (yn === yd) {					// y/y, 0/0, _/_ => 1
	yn = yd = 1;
    } else if (yn === 0 || yd === _) {			// 0/y, y/_ => 0
	yn = 0;
	yd = 1;
    }
    if (xn === _ || xd === 0) {				// _/x, x/0 > y/d
	return 1;
    } else if (yn === _ || yd === 0) {			// NaN or y < _/y, y/0
	return -1;
    } else if (isNaN (xn)) {
	if (isNaN (yn)) {				// NaN = NaN
	    return 0;
	} else {					// NaN > y/d
	    return 1;
	}
    } else {
	if (isNaN (yn)) {				// x/d < NaN
	    return -1;
	} if (isNaN (xd)) {
	    if (isNaN (yd)) {				// x/NaN :: y/NaN => x :: y
		return CmpNum (xn, yn, true);
	    } else {					// 0 < x/NaN < y
		return yn ? 1 : -1;
	    }
	} else if (isNaN (yd)) {			// 0 < y/NaN < x
	    return xn ? -1 : 1;
	} else if (g && (xn >= KNOWN || yn >= KNOWN)) {	// Don't divide TBD/UNKNOWN
	    return xn - yn;
	} else {					// x/d < = > y/d
	    return xn*yd - yn*xd;
	}
    }
}
// Compare two rational numbers (with possibly transfinite numerators and/or
// denominators) for sorting purposes.
// The following sort order is always followed:
// n/d*t^i < ?*t^i < any*t^(i+1); 0 < any*t^any
function CmpOrderRat (xn, xd, xp, yn, yd, yp) {
    if (xn === 0 || yn === 0) {		// 0 < anything else
	return CmpRat (xn, xd, yn, yd, false);
    }
    var un = OrderPair (xn, xp);
    var ud = OrderPair (xd, xp);
    var vn = OrderPair (yn, yp);
    var vd = OrderPair (yd, yp);
    var o = un[1]-ud[1] - vn[1]+vd[1];
    return o ? o : CmpRat (un[0], ud[0], vn[0], vd[0], false);
}
// Add two (possibly transfinite) numbers
function AddPair (x, y) {
    return x[1] !== y[1] ? x[1] < y[1] ? y : x : [x[0]+y[0], x[1]];
}
// Diagonal squared of two (possibly transfinite) numbers
function DiagPair (x, y) {
    return x[1] < y[1] ? [y[0]*y[0], y[1]] :
      [x[0]*x[0] + (x[1] > y[1] ? 0 : y[0]*y[0]), x[1]];
}
// Product of two (possibly transfinite) numbers
function MulPair (x, y) {
    return [x[0]*y[0], x[1]+y[1]];
}
// Compare two (possibly transfinite) bounding box circumferences for sorting purposes:
function CmpOrderAdd (xw, xh, xp, yw, yh, yp) {
    xw = AddPair (OrderPair (xw, xp), OrderPair (xh, xp));
    yw = AddPair (OrderPair (yw, yp), OrderPair (yh, yp));
    return CmpNum (uw[1], yw[1], true) || CmpNum (uw[0], vw[0], true);
}
// Compare two (possibly transfinite) bounding box diagonals for sorting purposes:
function CmpOrderDiag (xw, xh, xp, yw, yh, yp) {
    xw = DiagPair (OrderPair (xw, xp), OrderPair (xh, xp));
    yw = DiagPair (OrderPair (yw, yp), OrderPair (yh, yp));
    return CmpNum (uw[1], yw[1], true) || CmpNum (uw[0], vw[0], true);
}
// Compare two (possibly transfinite) bounding box areas for sorting purposes:
function CmpOrderMul (xw, xh, xp, yw, yh, yp) {
    xw = MulPair (OrderPair (xw, xp), OrderPair (xh, xp));
    yw = MulPair (OrderPair (yw, yp), OrderPair (yh, yp));
    return CmpNum (uw[1], yw[1], true) || CmpNum (uw[0], vw[0], true);
}
// Compare two solutions based on user-selected default sort criteria
function SortCmp1 (i, x, y) {
    var u;
    var v;
    switch (i) {
    default:		// huh?
	return 0;
    case S_MINP:	// Minimum population
	return CmpNum (x.p_minp, y.p_minp, true);
    case S_AVGP:	// Averge population
	u = OrderPair (x.p_avgp, x.p_per);
	v = OrderPair (y.p_avgp, y.p_per);
	return CmpNum (u[1], v[1], true) || CmpNum (u[0], v[0], true);
    case S_MAXP:	// Maximum population
	u = OrderPair (x.p_maxp, x.p_per);
	v = OrderPair (y.p_maxp, y.p_per);
	return CmpNum (u[1], v[1], true) || CmpNum (u[0], v[0], true);
    case S_RPOP:	// Ratio of min/max population
	return CmpRat (x.p_minp, OrderNum (x.p_maxp),
	  y.p_minp, OrderNum (y.p_maxp), false);
    case S_INF:		// Influence
	u = OrderPair (x.p_inf, x.p_per);
	v = OrderPair (y.p_inf, x.p_per);
	return CmpNum (u[1], v[1], true) || CmpNum (u[0], v[0], true);
    case S_DEN:		// Minimum density
	return CmpOrderRat (x.p_minp, x.p_inf, x.p_per, y.p_minp, y.p_inf, y.p_per);
    case S_ADEN:	// Average density
	return CmpOrderRat (x.p_avgp, x.p_inf, x.p_per, y.p_avgp, y.p_inf, y.p_per);
    case S_MDEN:	// Maximum density
	return CmpOrderRat (x.p_maxp, x.p_inf, x.p_per, y.p_maxp, y.p_inf, y.p_per);
    case S_HEAT:	// Heat
	u = OrderPair (x.p_heat, x.p_per);
	v = OrderPair (y.p_heat, x.p_per);
	return CmpNum (u[1], v[1], true) || CmpNum (u[0], v[0], true);
    case S_TEMP:	// Temperature
	return CmpNum (x.p_temp, y.p_temp, true);
    case S_VOL:		// Volatility
	return CmpNum (x.p_vol, y.p_vol, true);
    case S_SVOL:	// Strict volatility
	return CmpNum (x.p_svol, y.p_svol, true);
    case S_RVOL:	// Strict volatility / volatility
	return CmpRat (x.p_svol, x.p_vol, y.p_svol, y.p_vol, false);
    case S_SYMM:	// Symmetry (, glide symmetry)
	return CmpNum (x.p_GetSymm (), y.p_GetSymm (), true) ||
		CmpNum (x.p_GetPar (0, 0), y.p_GetPar (0, 0), true) ||
		CmpNum (x.p_GetGlide (), y.p_GetGlide (), true);
    case S_GLIDE:	// Glide symmetry (, symmetry)
	return CmpNum (x.p_GetGlide (), y.p_GetGlide (), true) ||
		CmpNum (x.p_GetSymm (), y.p_GetSymm (), true) ||
		CmpNum (x.p_GetPar (0, 0), y.p_GetPar (0, 0), true);
    case S_BOXW:	// Smallest bounding box width
	return CmpNum (x.p_boxw, y.p_boxw, true);
    case S_BOXH:	// Smallest bounding box height
	return CmpNum (x.p_boxh, y.p_boxh, true);
    case S_BOXD:	// Smallest bounding box diagonal
	return CmpNum (Diag (x.p_boxw, x.p_boxh), Diag (y.p_boxd, y.p_boxh), true);
    case S_BOXC:	// Smallest bounding box circumference
	return CmpNum (x.p_boxw+x.p_boxh, y.p_boxw+y.p_boxh, true);
    case S_BOXA:	// Smallest bounding box area
	return CmpNum (x.p_boxw*x.p_boxh, y.p_boxw*y.p_boxh, true);
    case S_BOXS:	// Smallest bounding box squareness
	return CmpRat (x.p_boxh, x.p_boxw, y.p_boxh, y.p_boxw, false);
    case S_LBOXW:	// Largest bounding box width
	return CmpNum (x.p_lboxw, y.p_lboxw, true);
    case S_LBOXH:	// Largest bounding box height
	return CmpNum (x.p_lboxh, y.p_lboxh, true);
    case S_LBOXD:	// Largest bounding box diagonal
	return CmpOrderDiag (x.p_lboxw, x.p_lboxh, x.p_per, y.p_lboxw, y.p_lboxh, y.p_per);
    case S_LBOXC:	// Largest bounding box circumference
	return CmpOrderAdd (x.p_lboxw, x.p_lboxh, x.p_per, y.p_lboxw, y.p_lboxh, y.p_per);
    case S_LBOXA:	// Largest bounding box area
	return CmpOrderMul (x.p_lboxw, x.p_lboxh, x.p_per, y.p_lboxw, y.p_lboxh, y.p_per);
    case S_LBOXS:	// Largest bounding box squareness
	return CmpOrderRat (x.p_lboxh, x.p_lboxw, x.p_per, y.p_lboxh, y.p_lboxw, y.p_per);
    case S_HULLW:	// Hull width
	return CmpNum (x.p_hullw, y.p_hullw, true);
    case S_HULLH:	// Hull height
	return CmpNum (x.p_hullh, y.p_hullh, true);
    case S_HULLD:	// Hull diagonal
	return CmpOrderDiag (x.p_hullw, x.p_hullh, x.p_per, y.p_hullw, y.p_hullh, y.p_per);
    case S_HULLC:	// Hull circumference
	return CmpOrderAdd (x.p_hullw, x.p_hullh, x.p_per, y.p_hullw, y.p_hullh, y.p_per);
    case S_HULLA:	// Hull area
	return CmpOrderMul (x.p_hullw, x.p_hullh, x.p_per, y.p_hullw, y.p_hullh, y.p_per);
    case S_HULLS:	// Hull squareness
	return CmpOrderRat (x.p_hullh, x.p_hullw, x.p_per, y.p_hullh, y.p_hullw, y.p_per);
    case S_RBOXW:	// Rotor box width
	return CmpNum (x.p_GetRwidth (), y.p_GetRwidth (), true);
    case S_RBOXH:	// Rotor box height
	return CmpNum (x.p_GetRheight (), y.p_GetRheight (), true);
    case S_RBOXD:	// Rotor box diagonal
	return CmpNum (Diag (x.p_GetRwidth (), x.p_GetRheight ()), Diag (x.p_GetRwidth (), y.p_GetRheight ()), true);
    case S_RBOXC:	// Rotor box circumference
	return CmpNum (x.p_GetRwidth () + x.p_GetRheight (), y.p_GetRwidth () + y.p_GetRheight ());
    case S_RBOXA:	// Rotor box area
	return CmpNum (x.p_GetRwidth () * x.p_GetRheight (), y.p_GetRwidth () * y.p_GetRheight ());
    case S_RBOXS:	// Rotor box squareness
	return CmpRat (x.p_GetRwidth (), x.p_GetRheight (), y.p_GetRwidth (), y.p_GetRheight (), false);
    case S_ACT:		// Active rotor cells
	return CmpNum (x.p_GetAct (), y.p_GetAct (), false);
    case S_NROT:	// Number of rotors
	return CmpNum (x.p_GetNrotors (), y.p_GetNrotors (), false);
    case S_PER:		// Period
	return CmpNum (x.p_per, y.p_per, true);
    case S_MOD:		// Modulus (, period); pretend _/2 < _, etc.
	u = x.p_GetRmod ();
	v = y.p_GetRmod ();
	return CmpRat (x.p_per, u, y.p_per, v, false) || (u - v) ||
		CmpNum (x.p_per, y.p_per, true);
    case S_RMOD:	// Period / modulus
	return x.p_GetRmod () - y.p_GetRmod ();
    case S_VEL:		// Velocity (, direction, period)
	return CmpRat (x.p_velx, x.p_veld, y.p_velx, y.p_veld, false) ||
		CmpRat (x.p_vely, x.p_veld, y.p_vely, y.p_veld, false) ||
		CmpNum (x.p_per, y.p_per, true);
    case S_SLP:		// Slope
	return CmpNum (x.p_GetSlope (), y.p_GetSlope (), false);
    case S_GLS:		// Gliders
	return CmpNum (x.p_gls, y.p_gls, true);
    case S_RGLS:	// Gliders/bit
	return x.p_gls >= KNOWN || y.p_gls >= KNOWN ? CmpNum (x.p_gls, y.p_gls, true) :
		CmpRat (x.p_gls, x.p_minp, y.p_gls, y.p_minp, true);
    case S_GLNA:	// Glider number (all)
	return CmpNum (x.p_glna || 0, y.p_glna || 0, true);
    case S_GLNR:	// Glider number (rule)
	return CmpNum (x.p_glnr || 0, y.p_glnr || 0, true);
    case S_FREQ:	// Frequency
	return CmpNum (x.p_freq, y.p_freq, false);
    case S_RAR:		// Rarity
	return CmpNum (FREQBASE/x.p_freq, FREQBASE/y.p_freq, false);
    case S_TTS:		// Time to stabilize
	return CmpNum (x.p_tts, y.p_tts, false);
    case S_EF:		// Evolutionary factor
	return CmpNum (x.p_GetEf (), y.p_GetEf (), true);
    case S_CAT:		// Category
	return CmpNum (rulelib[sortrule][x.p_hid].h_cid,
			rulelib[sortrule][y.p_hid].h_cid, true);
    case S_NBR:		// Neighborhoods
	return CmpNum (y.p_GetRbn (), x.p_GetRbn (), true);
    case S_HDR:		// Header name
	return CmpName (x.p_hdr.h_name, y.p_hdr.h_name);
    case S_FILE:	// File name
	return CmpName (x.p_file, y.p_file);
    case S_APG:		// apg search name
	return CmpName (x.p_GetApg (sortrule), y.p_GetApg (sortrule));
    case S_SOF:		// SOF name
	return CmpName (x.p_GetSof (sortrule), y.p_GetSof (sortrule));
    case S_LIS:		// LIS name
	return CmpName (x.p_GetLis (sortrule), y.p_GetLis (sortrule));
    case S_HRD:		// HRD name
	return CmpName (x.p_GetHrd (sortrule), y.p_GetHrd (sortrule));
    case S_WIKI:	// Wiki name
	return CmpName (x.p_GetWiki (sortrule), y.p_GetWiki (sortrule));
    case S_PAT:		// Pattern name
	return CmpName (x.p_name, y.p_name);
    case S_IMG:		// Pattern image (including population, height, width)
	return CmpNum (x.p_minp, y.p_minp, true) ||
		CmpNum (x.p_boxh, y.p_boxh, true) || CmpNum (x.p_boxw, y.p_boxw, true) ||
		CmpImg (x.p_img, x.p_boxw, x.p_boxh, y.p_img, y.p_boxw, y.p_boxh);
    case S_NATIVE:	// Native database ordering
	return x.p_idx - y.p_idx;
    }
}
// Compare two solutions based on user-selected and default sort criteria
// If main sort criterion is equal, sort by secondary criteria: population,
// period, name (for list), box, image. Name should normally be unique.
function SortCmp (x, y) {
    return (SortCmp1 (defsort1, x, y) || SortCmp1 (defsort2, x, y)*sortdir2 ||
	    SortCmp1 (S_MINP, x, y) || SortCmp1 (S_PER, x, y) ||
	    (view === V_LIST && CmpName (x.p_name, y.p_name)) ||
	    SortCmp1 (S_BOXH, x, y) || SortCmp1 (S_BOXW, x, y) || SortCmp1 (S_IMG, x, y) ||
	    x.p_idx - y.p_idx) * sortdir1;
}
//------------------------------ Global variables ------------------------------
// Rule-dependent lists (rulesec, rulerle, rulemask, rulenames: [R_TOTAL, R_OTHER] can be changed)
var rulepage = "lifepage;b2s2;b34s34;b36s23;b36s245;b3xs23y;b3xs23y;b3xs23y;rulell;rulevl;rulemn;rulemn;rulemn;rulemn;rulemn;;;;".split (";");	// Rule main pages
var rulesec = ";22;34;36;rl;8l;pl;hl;ll;vl;n0;n1;n2;n4;n5;;;;".split (";");			// Rule section prefixes
var rulerle = ["B3/S23", "B2/S2", "B34/S34", "B36/S23", "B36/S245", "B3/S238", "B38/S23", "B38/S238",
    "B2n3/S23-q", "B2n3-q5y6c/S23-k",
    "B3/S2ae3aeijr4-cknqy", "B3/S2ae3aeijr4-ckqy", "B3/S2aei3aeijr4-cknqy", "B3/S2ae3aeijr4-cknqy5e",
    "B3/S2ae3aeijr4-ckqy5e", "", "", "", ""];	// Rule RLE rule strings
var rulemask = [0x3008,0x1004,0x6018,0x3048,0xD048,0x43008,0x3108,0x43108,0x3FE,0x3FE,0x3FE,0x3FE,0x3FE,0x3FE,0x3FE,0,0,0,0];	// Rule mask for f_IsStill
var rulelib = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []];		// Lists of all object lists in each rule
var rulehrd = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
var rulefiles = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];	// Lists of all files in each rule
var results = new Array (R_MAX);	// Lists of found objects in each rule
var nresults = new Array (R_MAX);	// Lengths of above results
var expanded = new Array (R_MAX);	// Which rules are expanded in search results
var rulefirst = new Array (R_MAX);	// Index of first displayed list row in each rule
					// (in bucket list, # of pages in each rule)
// Number caches
var transval = [NaN];			// Cache of transitive number values; NaN*t^0 is first
var transord = [0];			// Cache of transitive number orders
// User interface state variables
var aperture;			// Window size [width, height]
var sortcols = [];		// Indices into insort1s/insort2s select for different sort types
var srch;			// Search criteria
var saves;			// Saved search state
var view;			// Result display format
var maxlist;			// Maximum results per list page
var numfmt = N_DEC;		// Number display format
var defsort1, defsort2;		// Default sort 1+2criteria
var sortdir1, sortdir2;		// Sort 1+2 directions (1=normal, -1=reverse)
var decdigits = 7;		// Digits to display
var nosort = false;		// Suppress recursive auto-sorting?
var ifcan = false;		// Are canvases supported?
var canctx;			// Canvas context
var imaged;			// Currently-visible image parameters (if any)
var oldcats;			// previously-selected categories, in case of Cancel
// Search results state varibles
var nfound = 0;			// Number of matches found
var nrules;			// Number of matching rules
// Result display state variables
var viscol = new Array (S_MAX);	// visible columns
var nviscol;			// Total number of visible columns
var glidercol;			// Glider column index (uses different colors)
var selecti;			// Currently-selected table index (or -1)
var selectb;			// Library format of current pattern (or null)
var selectr;			// Rule associated with current pattern
var state = Z_LOADING;		// Search state
var sortrule;			// Rule associated with current sort
var catobj;			// Catagolue APG code for currently-displayed object
// Stamp page display state variables
var stampw;			// Stamp image width
var stamph;			// Stamp image height
var stampx;			// Number of stamp image columns
var stampy;			// Number of stamp image rows
var stampn;			// Number of stamp images on current page
var stampm;			// Magnification factor
var stampr;			// Stamp page width (i.e. right edge)
var stampb;			// Stamp page height (i.e. bottom edge)
var stamprule;			// Rule output on stamp RLE image
var stampf;			// Stamp page as binary field
var stampq;			// Stamp page as pattern
var pageno;			// Stamp page number
var pagesize;			// Full stamp page size
var npages;			// Number of stamp pages
var viewtab = false;		// View table under stamp collection?
// Rule search state variables
var rules = [[[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0]],
	     [[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0]]];	// Current birth+survival rules
var undone = [[[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0]],
	      [[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0]]];	// Previous rules (B9=hex)
// Tool tip state globals
var tipname = "";		// Active tool-tip
var tiptimer = null;		// Timer for activating tool tip
var tipshown = false;		// Is tool tip visible?
var tok = [];			// List of explicitly enabled/disabled elements
//------------------------------ Diagnostic functions -------------------------
// Aggregate anomalous objects for debugging purposes
var Uw;				// List of all transfinite or negative properties
var U;				// Sets of all properties
var Ul;				// Lengths of all sets in U
var toofew = "";		// Patterns with too few images
var toomany = "";		// Patterns with too many images
var badavg = "";		// Patterns with average pop < minimum
var badvol = "";		// Patterns with volatility > 1
var badpop = "";		// Patterns with phases < minimum pop.
var badtemp = "";		// Patterns where heat !== temp*pop
var numwiki = 0;		// Max number of wiki pages per object
var numhid = 0;			// Max number of header sections
// Dump out an object's contents
function Q (obj) {
    var result = "";
    for (var i in obj) {
	result += i + "=" + obj[i] + "\n";
    }
    return result;
}
// Eval button pressed: evaluate user-entered Javascript expression
function EvalJS () {
    ReTime ();				// Reset tool-tip timer
    try {
	Enter (eval (GetValue ("inexprt")));
    } catch (c) {
	Enter (c);
    }
}
// Add a numeric instance to s set of properties.
function Notice (a, n, p, s) {
    if ((isNaN (n) ? InNaN (a) : a.indexOf (n)) < 0) {
	a.push (n);
    }
    if (s && (isNaN (n) || n < 0 || n >= OMEGA)) {
	Uw.push (p.p_GetFile () + "/" + p.p_GetNames () + "." + s + " = " + n);
    }
    return a.length;
}
// Convert a trackable integer property into a condensed one that fits in 26 bits
function TrackP (p) {
    return p >= OMEGA ? p - OMEGA + PAIR : p;
}
// Track unique values of all properties
function TrackU (p) {
    // p_img, p.p_file, p.p_apg, p_lis, p.p_name, p_sof should be mostly unique, so no use tracking them
    // (besides which, they are non-numeric)
    // p_page, p.p_hid are never searchable, so no use tracking them either
    Ul.p_minp = Notice (U.p_minp, p.p_minp, p, listhdr.p_minp);
    Ul.p_maxp = Notice (U.p_maxp, p.p_maxp, p, listhdr.p_maxp);
    Ul.p_avgp = Notice (U.p_avgp, p.p_avgp, p, listhdr.p_avgp);
    Ul.p_inf = Notice (U.p_inf, p.p_inf, p, listhdr.p_inf);
    Ul.p_heat = Notice (U.p_heat, p.p_heat, p, listhdr.p_heat);
    Ul.p_temp = Notice (U.p_temp, p.p_temp, p, listhdr.p_temp);
    Ul.p_vol = Notice (U.p_vol, p.p_vol, p, listhdr.p_vol);
    Ul.p_svol = Notice (U.p_svol, p.p_svol, p, listhdr.p_svol);
    Ul.p_symm = Notice (U.p_symm, p.p_symm, p, listhdr.p_symm);
    Ul.p_boxw = Notice (U.p_boxw, p.p_boxw, p, listhdr.p_boxw);
    Ul.p_boxh = Notice (U.p_boxh, p.p_boxh, p, listhdr.p_boxh);
    Ul.p_lboxw = Notice (U.p_lboxw, p.p_lboxw, p, listhdr.p_lboxw);
    Ul.p_lboxh = Notice (U.p_lboxh, p.p_lboxh, p, listhdr.p_lboxh);
    Ul.p_hullw = Notice (U.p_hullw, p.p_hullw, p, listhdr.p_hullw);
    Ul.p_hullh = Notice (U.p_hullh, p.p_hullh, p, listhdr.p_hullh);
    Ul.p_per = Notice (U.p_per, p.p_per, p, listhdr.p_per);
    Ul.p_gls = Notice (U.p_gls, p.p_gls);
    Ul.p_freq = Notice (U.p_freq, p.p_freq);
    Ul.p_tts = Notice (U.p_tts, p.p_tts, p, listhdr.p_tts);
    Ul.p_veld = Notice (U.p_veld, p.p_veld, p, listhdr.p_veld);
    Ul.p_velx = Notice (U.p_velx, p.p_velx, p, listhdr.p_velx);
    Ul.p_vely = Notice (U.p_vely, p.p_vely, p, listhdr.p_vely);
    Ul.p_vel = Notice (U.p_vel, p.p_velx*10000 + p.p_vely + p.p_veld/PAIR);
    Ul.p_rpop = Notice (U.p_rpop, OrderDiv (p.p_minp, p.p_maxp));
    var rmod = p.p_GetRmod ();
    Ul.p_rmod = Notice (U.p_per, rmod, p, listhdr.p_rmod);
    Ul.p_mod = Notice (U.p_rmod, p.p_per/rmod);
    Ul.p_box = Notice (U.p_box, p.p_boxw + p.p_boxh/PAIR);
    Ul.p_boxs = Notice (U.p_boxs, Div (p.p_boxh, p.p_boxw));
    Ul.p_lbox = Notice (U.p_lbox, TrackP (p.p_lboxw) + TrackP (p.p_lboxh)/PAIR);
    Ul.p_lboxs = Notice (U.p_lboxs, OrderDiv (p.p_lboxh, p.p_lboxw));
    Ul.p_hull = Notice (U.p_hull, TrackP (p.p_hullw) + TrackP (p.p_hullh)/PAIR);
    Ul.p_hulls = Notice (U.p_hulls, OrderDiv (p.p_hullh, p.p_hullw));
    Ul.p_rvol = Notice (U.p_rvol, Div (p.p_svol, p.p_vol));
    Ul.p_ef = Notice (U.p_ef, p.p_GetEf (), p, listhdr.p_ef);
    Ul.p_diff = Notice (U.p_diff, p.p_diff, p, listhdr.p_diff);
}
// Initialize counters of unique values of all properties
function InitU () {
    Uw = [];
    U = new Pattern (0, [], [], [], [], [], [], [], [], [], [],
      [], [], [], [], [], [], [], [], [],
      [], [], [], [], [], [], [], [], [], [], []);
    U.p_vel = [];
    U.p_rpop = [];
    U.p_rmod = [];
    U.p_mod = [];
    U.p_box = [];
    U.p_boxs = [];
    U.p_lbox = [];
    U.p_lboxs = [];
    U.p_hull = [];
    U.p_hulls = [];
    U.p_rvol = [];
    U.p_ef = [];
    U.p_diff = [];
    Ul = new Pattern (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    Ul.p_vel = 0;
    Ul.p_rpop = 0;
    Ul.p_rmod = 0;
    Ul.p_mod = 0;
    Ul.p_box = 0;
    Ul.p_boxs = 0;
    Ul.p_lbox = 0;
    Ul.p_lboxs = 0;
    Ul.p_hull = 0;
    Ul.p_hulls = 0;
    Ul.p_rvol = 0;
    Ul.p_ef = 0;
    Ul.p_diff = 0;
}
//------------------------------ Life field functions --------------------------
// Compact borders, deleting unnecessary white space from all sides
// Empty field will set f_lft=f_rgt, f_top=f_btm
function Compact (f) {
    var i;
    f.f_lft = f.f_top = 0;
    f.f_rgt = f.f_wid;
    f.f_btm = f.f_hgt;
    while (f.f_top < f.f_btm) {
	for (i = f.f_lft; i < f.f_rgt; ++i) {
	    if (f.f_img[f.f_top*f.f_wid+i]) {
		break;
	    }
	}
	if (i < f.f_rgt) {
	    break;
	}
	++f.f_top;
    }
    while (f.f_top < f.f_btm) {
	for (i = f.f_lft; i < f.f_rgt; ++i) {
	    if (f.f_img[(f.f_btm-1)*f.f_wid+i]) {
		break;
	    }
	}
	if (i < f.f_rgt) {
	    break;
	}
	--f.f_btm;
    }
    while (f.f_lft < f.f_rgt) {
	for (i = f.f_top; i < f.f_btm; ++i) {
	    if (f.f_img[i*f.f_wid+f.f_lft]) {
		break;
	    }
	}
	if (i < f.f_btm) {
	    break;
	}
	++f.f_lft;
    }
    while (f.f_lft < f.f_rgt) {
	for (i = f.f_top; i < f.f_btm; ++i) {
	    if (f.f_img[i*f.f_wid+f.f_rgt-1]) {
		break;
	    }
	}
	if (i < f.f_btm) {
	    break;
	}
	--f.f_rgt;
    }
    return f;
}
//------------------------------ File format conversions -----------------------
// Convert a binary bit rule integer into a string of digits
function BinRule (r) {
    var str = "";
    for (var i = 0; i < 10; ++i) {
	if ((r >> i) & 1) {
	    str += i;
	}
    }
    return str;
}
// Convert RLE rule string to string used in apg and Eppstein web site pathnames
function ApgEpp (s) {
    return s.toLowerCase ().replace (/\//, "");
}
// Parse RLE "rules=" clause, or Catagolue rule
function RleRule (str, rle) {
    var result;					// Resulting rule index
    if (rle) {
	rulerle[R_OTHER] = str;
    }
    if (rle && str === rulerle[R_LEAP]) {	// Named rules are handled specially
	result = R_LEAP;
    } else if (rle && str === rulerle[R_VESSEL]) {
	result = R_VESSEL;
    } else if (rle && str === rulerle[R_NIEMIEC0]) {
	result = R_NIEMIEC0;
    } else if (rle && str === rulerle[R_NIEMIEC1]) {
	result = R_NIEMIEC1;
    } else if (rle && str === rulerle[R_NIEMIEC2]) {
	result = R_NIEMIEC2;
    } else if (rle && str === rulerle[R_NIEMIEC4]) {
	result = R_NIEMIEC4;
    } else if (rle && str === rulerle[R_NIEMIEC5]) {
	result = R_NIEMIEC5;
    } else {
	var r = 0;			// Build up outer totalistic rule (B | S<<10):
	var base = 10;			// Bn=0..9, Sn=10..19, illegal=20+
	var d = 0;			// Active digit (0=none)
	var m = 0;			// Minus sign?
	for (var i = 0; i < str.length; ++i) {
	    var c = str.charCodeAt (i);
	    if ((c|A_LC) === A_b) {		// B/b introduces birth digits
		d = m = base = 0;
	    } else if ((c|A_LC) === A_s) {	// S/s introduces survival digits
		base = 10;
		d = m = 0;
	    } else if (c === A_SLASH) {		// / swaps birth+death
		base = 10 - base;
		d = m = 0;
	    } else if (c >= A_0 && c <= A_9) {	// Digits set rule
		r |= 1 << (d = base+c-A_0);
		m = 0;
	    } else if (c === A_MINUS) {		// - negates non-totalistic rules
		m = 1;
		r |= 0x100000;
	    } else if ((c|=A_LC) >= A_a && c <= A_z) {	// Letter sets non-totalistic rule
		r |= 0x100000;
		if (m) {			// digit - letter: remove one sub-rule
						// TBD: remove subrule d/c
		} else {			// digit letter: remove main rule, add sub-rule
						// TBD: remove rule d; add subrule d/c
		}
	    } else {				// Other characters are invalid
		r |= 0x200000;
	    }
	}
	if (r < 0x100000) {			// B?/S?: unknown outer totalistic
	    result = "B" + BinRule (r) + "/S" + BinRule (r >> 10);
	    if (!rle) {
		return ApgEpp (result);
	    }
	    rulemask[R_TOTAL] = r;
	    rulerle[R_TOTAL] = result;
	    result = R_TOTAL;
	    for (i = 0; i < R_LEAP; ++i) {	// If RLE matches a standard rule, use that rule
		if (r === rulemask[i]) {
		    result = i;
		}
	    }
	} else if (r < 0x200000) {		// B?/S?: unknown non-totalistic
	    result = str;			// TBD: create canonical Hensel-format rule
	    if (!rle) {
		return ApgEpp (result);
	    }
	    rulemask[R_NTOTAL] = r;
	    rulerle[R_NTOTAL] = result;
	    result = R_NTOTAL;
	    // TBD: check for Leap|Vessel|Niemiec0|1|2|4|5 patterns here, rather than exact earlier
	} else if (!rle) {			// Other rule for Catagolue: invalid
	    return "*";
	} else {				// Other: unknown
	    result = R_OTHER;
	}
    }
    rulenames[R_TOTAL] = rulerle[R_TOTAL] + " (" + sunsupported + ")";
    rulenames[R_OTHER] = rulerle[R_OTHER] + " (" + sunsupported + ")";
    return result;
}
// The following data formats are used here:
// - Text file (string):
//   - Optional #-prefixed comment lines (preserved when copying to RLE)
//   - Simple list of NL-separated lines of . and o (or similar) characters
//   - This is used for interchange with user and external programs
// - RLE file (string):
//   - Optional #-prefixed comment lines (preserved when copying)
//   - Recommended (but optional) header line with x=n, y=n, optional rule=n
//   - One or more runs of dead cells, living cells, newlines, ending with "!"
//   - This is used for interchange with user and external programs
// - Pattern library image (string):
//   - String of characters that are excess-32 encodings of a list of numbers;
//   - First number is height, second is width (values >223 store 0 instead)
//   - The rest is a list of (height) runs, where each run has ceil(width/6)
//     bytes, packing 6 Life cells to a byte; Values of n>63 mean (n+1) zeroes.
//   - Really huge patterns are HUGEPAT (height=width=-19, pattern=empty)
//   - This is used to store patterns internally for pattern-matching purposes
// - Pattern library pattern (object: Pattern):
//   - This contains many statistics about items from the pattern library
//   - p_img is either a pattern library image string, or an array of 2-8 of them.
//   - This is used to store the pattern libraries
// - Binary field (object: Field):
//   - This contains a binary matrix representation of the pattern
//   - It also contains adjustable borders
//   - This is used to manipulate patterns sizes and orientations
// - Symmetry (object: Symmetry):
//   - This contains an array of 1-8 library pattern representations, in all
//     possible translations and reflections
//   - It also contains height, width, and symmetry class
// - Search criteria (object: Searches):
//   - This includes all criteria used to qualify a search
//   - For image searches, it also contains a library pattern representation
//   - For others, it also contains a regular expression to match the text
// How to convert from one format to another (* are currently used):
// From \ To	Binary      Screen     RLE Text Life 1.06 APG         SOF               Library
// Binary	-           0:Convert* 0   0    0    0    7:Bin2Apgs* 10:Bin2Sofs*      5:Bin2Lib*/Convert
// RLE		1:Rle2Bin*  1+0        -   1+0  1+0  1+7                                1+5
// Text		2:Text2Bin* 2+0        2+0 -    1+0  2+7                                2+5
// Life 1.06	3:Life2Bin* 3+0        3+0 3+0  -    3+7                                3+5
// APG		6:Apg2Bin*  6+0        6+0 6+0  6+0  -                                  6+5
// SOF		9:Sof2Bin*  9+0        9+0 9+0  9+0  9+0              -                 9+5
// LIS		11:Lis2Bin* 11+0       11+0 11+0 11+0 11+0                              11+5
// Library	            0*         0*  0*   0*   8:p_GetApg*/4+7  11:p_GetSof*/4+10 4:Lib2Bin*/0+1
// apg search file names are unique names that depend on an object's bit pattern and behavior.
// They are of one of the following forms:
//   xs<population>_<encoding> (for still-life; population>0)
//   xp<period>_<encoding> (for oscillator; period>1)
//   xq<period>_<encoding> (for spaceship)
//   ov_s<population> (for still-life >40x40)
//   ov_p<period> (for oscillator >40x40; period>1)
//   ov_q<period> (for spaceship >40x40)
//   yl<population linear increase period>_1_<increase>_<md5 hash> (for puffer or gun)
//   zz_LINEAR (for linear growth pattern somehow not caught by yl_)
//   zz_QUADRATIC (for quadratic growth pattern)
//   zz_REPLICATOR (for replicator)
//   ZZ_EXPLOSIVE (for irregular explosive pattern)
//   PATHOLOTICAL (for growing pattern that cannot otherwise be classified)
// Patterns are divided into nx5 strips, with one character for each column, from left to right.
// Each character from (0..9,a..v) is a base-32 number, with LSB in the top row.
// Blank columns are compressed: w=00, x=000, y0..y9,ya..yz=4-40 zeroes.
// If a pattern is more than 5 lines high, multiple 5-line strip is separated by z (newline)
// Crop pattern so top and left edges are not empty; trailing 0s and zs are suppressed.
// All 8 orientations in all phases must be generated;
// The lowest ASCII encoding among the shortest-length encodings is the canonical name.
// SOF format:
// - If a line starts with off cells, write "0"
// - If count of consecutive cells <=78, write this count + 0x30
//   - If count of consecutive cells >78, write as many 78+0 runs as necessary first (i.e. "~0")
// - At end of each line, ignore empty cells and write "-"
//   - For multiple line ends, write "+" and line count + 0x30 (this was never implemented)
//     - If count of consecutive blank lines >78, write as many 78-line empties as necessary first (i.e. "+~")
// - At end of pattern, ignore empty lines and write "."
// - Optionally, include pattern name within parentheses
// - Optionally, include "!" followed by comment to end of line
// The highest ASCII encoding among the lowest-population encodings is the canonical name.
// (For spaceships, only phases moving N, NW, or NNW are considered (not yet implemented here))
// LIS format is basically the same as the internal library format, prefixed by 2 excess-32
// characters defining period and population, respectively.
// Read Life pattern from RLE data
function Rle2Bin (str, p) {
    var wid = 0;
    var hgt = 0;
    var f;
    var n;
    var x;
    var i;
    str = str.replace (/\n/g, "");		// Newlines ignored within RLE pattern
    for (var pass = 0; pass < 2; ++pass) {	// Pass 0 measures, pass 1 reads
	if (pass) {
	    f = new Field (wid += 2*p, hgt += 2*p);
	}
	for (var y = x = i = n = 0; i < str.length; ++i) {
	    var c = str[i];			// Next character
	    var j = "0123456789".indexOf (c);	// Digit?
	    if (j >= 0) {			// Accumulate digits
		n = 10*n+j;
	    } else {				// Run of some character:
		if (n === 0) {			// No count => implicit 1
		    ++n;
		}
		if (c === "$") {		// $ => end of line
		    x = 0;
		    y += n;
		} else if (c === "!") {		// ! => end of file
		    break;
		} else {
		    x += n;
		    if (c !== "b" && c !== ".") {	// ./b => dead, other => alive
			wid = max (wid, x);
			hgt = y+1;
			if (pass) {
			    f.f_maxp += n;
			    if (c === "?") {		// ? => wild
				c = -1;
			    } else {			// other => alive
				f.f_minp += n;
				c = 1;
			    }
			    f.f_wild |= c;
			    while (n) {
				f.f_img[(y+p)*wid+x+p-n--] = c;
			    }
			}
		    }
		}
		n = 0;				// Reset count for next run
	    }
	}
    }
    return Compact (f);
}
// Read Life pattern from SOF data
function Sof2Bin (str, p) {
    var wid = 0;
    var hgt = 0;
    var f;
    str = str.replace (/[ \t]/g, "") .replace (/\..*$/, "");	// Whitespace ignored within SOF pattern
    for (var pass = 0; pass < 2; ++pass) {	// Pass 0 measures, pass 1 reads
	if (pass) {
	    f = new Field (wid += 2*p, hgt += 2*p);
	}
	for (var y = 0, x = 0, r = 0, i = 0; i < str.length; ) {
	    var c = str.charCodeAt (i++);	// Next character
	    if (c >= A_0) {			// cell run
		x += c -= A_0;
		if ((r ^= 1) && c) {
		    wid = max (wid, x);
		    hgt = y+1;
		}
		if (pass) {
		    if (r) {
			f.f_maxp = f.f_minp += c;
		    }
		    while (c) {
			f.f_img[(y+p)*wid+x+p-c--] = r;
		    }
		}
		continue;
	    } else if (c === A_MINUS) {		// one line break
		++y;
	    } else if (c === A_PLUS) {		// multi-line break (future extension)
		if ((c = str.charCodeAt (i++)) <= A_0) {
		    continue;
		}
		y += c - A_0;
	    } else {				// invalid character: ignore
		continue;
	    }
	    x = r = 0;
	}
    }
    return Compact (f);
}
// Read Life pattern from text array. This also reads Life 1.05 format files
function Text2Bin (str, p) {
    var f;
    var wid = 0;
    var hgt = 0;
    for (var pass = 0; pass < 2; ++pass) {	// Pass 0 measures, pass 1 reads
	if (pass) {				// Pass 1: create new field
	    f = new Field (wid += 2*p, hgt += 2*p);
	}
	for (var y = 0, x = 0, i = 0; i < str.length; ++i) {
	    var c = str[i];			// Next character
	    if (c === "\n") {			// Newline at end of line
		x = 0;
		++y;
	    } else {				// space/./line => dead, other => alive
		if (pass && " .:,;!-+|=/\\_".indexOf (c) < 0) {
		    ++f.f_maxp;
		    if (c === "?") {		// ? => wild
			c = -1;
		    } else {			// other => alive
			++f.f_minp;
			c = 1;
		    }
		    f.f_wild |= f.f_img[(y+1)*wid+x+1] = c;
		}
		wid = max (wid, ++x);
	    }
	}
	hgt = ++y;
    }
    return Compact (f);
}
// Read Life pattern from Life 1.06 data
function Life2Bin (str, p) {
    var lft = _, top = _, rgt = -_, btm = -_, f;
    for (var pass = 0; pass < 2; ++pass) {	// Pass 0 measures, pass 1 reads
	if (pass) {				// Pass 1: create new field
	    var wid = max (0, rgt-lft)+p, hgt = max (0, btm-top)+p;
	    f = new Field (wid, hgt);
	}
	var s = str;
	while ((i = s.indexOf ("\n")) >= 0) {
	    var line = s.substring (0, i);
	    s = s.substring (i+1);
	    var x = parseInt (line);
	    i = line.indexOf (" ");
	    var y = i >= 0 ? parseInt (line.substring (i+1)) : 0;
	    lft = min (lft, x);
	    top = min (top, y);
	    rgt = max (rgt, x+1);
	    btm = max (btm, y+1);
	    if (pass) {
		if (!f.f_img[x = (y-top+p)*wid+x-lft+p]) {
		    ++f.f_maxp;
		    ++f.f_minp;
		    f.f_img[x] = f.f_wild = 1;
		}
	    }
	}
    }
    return Compact (f);
}
// Convert a library-format pattern into a field
// This could be done by Convert to RLE, then Rle2Bin, but since this is used
// in the inner loop of wildcard image search, this optimized version is
// provided instead.
// (NOTE: This is limited to small patterns without pattern size annotation overrides,
//  so Convert+Rle2Bin should be used in the general case, should that ever be needed)
function Lib2Bin (pat, minp, w, h, p) {
    var i = 0;					// Index into library string
    var hgt = pat.charCodeAt (i++) - A_SP;	// Height
    var wid = pat.charCodeAt (i++) - A_SP;	// Width
    if (minp && (wid <= 0 || hgt <= 0)) {	// Huge pattern (e.g. Gemini): can't match
	return null;				// But do NOT discard empty field
    }
    if ((w < wid || h < hgt) && (w < hgt || h < wid)) {	// Ignore patterns that exceed archetype size
	return null;
    }
    var f = new Field (wid+2*p, hgt+2*p);	// Returned field
    var n = 0;					// Number of queued-up spaces
    var k;					// Next 6 bits
    for (var y = 0; y < hgt; ++y) {
	for (var x = 0; x < wid; ++x, k <<= 1) {
	    if (x%6 === 0) {
		if (n < 0) {			// Coasting on stored newline
		    k = 0;
		} else if (n) {			// Coasting on stored blanks
		    --n;
		    k = 0;
		} else if (i >= pat.length) {	// End of pattern
		    k = 0;
		} else if ((k = pat.charCodeAt (i++) - A_SP) >= A_RUN || k < 0) {
		    n = k-A_RUN+2 - 1;		// Blank run or newline
		    k = 0;
		}				// Otherwise, 6 bits of data
	    }
	    if ((k >> 5) & 1) {			// Living cell
		++f.f_maxp;
		++f.f_minp;
		f.f_img[(y+p)*(wid+2*p)+x+p] = f.f_wild = 1;
	    }
	}
	if (n < 0) {				// Reset newline status
	    n = 0;
	}
    }
    return Compact (f);
}
// Read Life pattern from LIS data
function Lis2Bin (str, p, lis) {
    var f = Lib2Bin (str.substr (2), lis[1], lis[3], lis[2], p/2);
    return Compact (f);
}
// Read and/or measure one horizontal stripe in a Catalogue encoding
function ApgStripe (f, start, wid, s) {
    var n = s.length;
    var x = 0;
    var j;
    for (var i = 0; i < n; ) {
	var c = apgchars.indexOf (s[i++]);
	if (c < 32) {				// Normal binary image
	    for (j = 0; j < 5; ++j) {		// Vertical stripe;
		if (f && c & (1 << j)) {
		    f.f_img[start+j*wid+x] = 1;
		    f.f_wild = 1;
		    ++f.f_minp;
		    ++f.f_maxp;
		}
	    }
	    ++x;
	    if (c) {
		wid = max (wid, x);
	    }
	} else if (c === 32) {			// w: Run of two zeros
	    x += 2;
	} else if (c === 33) {			// x: Run of three zeros
	    x += 3;
	} else if (c === 34) {			// y(char): Run of four or more zeros
	    c = apgchars.indexOf (s[i++]);
	    if (c >= 0) {
		x += c+4;
	    }
	}
    }
    return wid;
}
// Convert a apg search-format pattern into a field
function Apg2Bin (apg, p, pack) {
    var wid = 0;				// Maximum width
    var hgt = 5;				// Maximum height
    if ((i = apg.lastIndexOf ("_")) >= 0) {
	apg = apg.substring (i+1);
    }
    for (i = 0, s = apg; (i = s.indexOf ("z")) >= 0; hgt += 5) {
	wid = ApgStripe (null, 0, wid, s.substring (0, i));
	s = s.substring (i+1);			// Count horizontal stripes
    }
    wid = ApgStripe (null, 0, wid, s);
    var f = new Field (wid += p, hgt += p);	// Returned field
    for (var j = p*wid+p, i = 0, s = apg; (i = s.indexOf ("z")) >= 0; j += 5*wid) {
	ApgStripe (f, j, wid, s.substring (0, i));
	s = s.substring (i+1);			// Read horizontal stripes
    }
    ApgStripe (f, j, wid, s);
    return pack ? Compact (f) : f;
}
// Convert a number of spaces into a compressed run in apg search-format string
function ApgRun (n) {
    var run = "";
    while (n > 39) {
	run += "yz";
	n -= 39;
    }
    return run + (n<4 ? apgzeros[n] : "y" + apgchars[n-4]);
}
// Convert binary pattern in any given orientation into apg search-format string
// It is assumed that there are no trailing empty rows at the bottom.
function Bin2Apg (f, start, dx, dy, width, height) {
    if (!f) {
	return "";		// Non-existent pattern returns non-existent apg search name
    }
    var n;			// Number of accumulated blanks
    var result = "";
    for (var y = 0; y < height; start += 5*dy) {
	for (var x = n = 0; x < width; ++x) {
	    var i = 0;
	    for (var j = 0; j < 5 && y+j < height; ++j) {
		var c = f.f_img[j*dy+x*dx+start];
		i += (c !== 0) << j;
	    }
	    if (i) {
		result += ApgRun (n) + apgchars[i];
		n = 0;
	    } else {
		++n;
	    }
	}
	if ((y += 5) < height) {
	    result += "z";
	}
    }
    return result;
}
// Convert binary pattern in any given orientation into SOF name string
// It is assumed that there are no trailing empty rows at the bottom.
function Bin2Sof (f, start, dx, dy, width, height) {
    if (!f) {			// Non-existent pattern returns non-existent SOF name
	return "";
    }
    var result = "";
    var b = 0;			// Number of line breaks
    for (var y = 0; y < height; start += dy, ++y, ++b) {
	for (var x = 0; x < width; ++x) {
	    if (f.f_img[x*dx+start]) {
		break;
	    }
	}
        if (x >= width) {			// Empty line: count but ignore
	    continue;
	}
	var n = 0;				// Number of accumulated cells
	var r = 1;				// Accumulated cell run type
	for (x = 0; x <= width; ++x, ++n) {
	    if (r !== (x < width ? f.f_img[x*dx+start] : 0)) {
		for (; b > 0; --b) {		// Uncompressed one - per empty line
		    result += "-";
		}
		for (; n > 78; n -= 78) {	// Split extremely long runs
		    result += "~0";
		}
		result += String.fromCharCode (A_0 + n);
		r ^= 1;
		n = 0;
	    }
	}
    }
    return result;
}
// Return the most canonical apg representation of a binary pattern
function Bin2Apgs (f) {
    var apg = "";
    var y = new Symm (f, f.f_lft, f.f_top, f.f_rgt, f.f_btm, -1);
    if (IsArray (y.y_img)) {			// Return the most canonical image
	for (var i = 0; i < y.y_img.length; ++i) {
	    apg = BestApg (apg, y.y_img[i]);
	}
    } else {					// Return the only image
	apg = y.y_img;
    }
    return apg;
}
// Return the most canonical SOF representation of a binary pattern
function Bin2Sofs (f) {
    var sof = "";
    var y = new Symm (f, f.f_lft, f.f_top, f.f_rgt, f.f_btm, -2);
    if (IsArray (y.y_img)) {			// Return the most canonical image
	for (var i = 0; i < y.y_img.length; ++i) {
	    sof = BestSof (sof, y.y_img[i]);
	}
    } else {					// Return the only image
	sof = y.y_img;
    }
    return sof;
}
// Convert a number of spaces into a compressed run in library-format string
function LibRun (n) {
    var run = "";
    while (n > 32) {
	run += "~";
	n -= 32;
    }
    return run + (n ? (n > 1 ? String.fromCharCode (n-2+A_RUN+A_SP) : " ") : "");
}
// Convert binary pattern in any given orientation into library-format string
// NOTE: Patterns with dimensions larger than 65503 cannot be properly represented
// (but such are never in the database anyway, so search could never find them)
// If wild>0, this generates unique strings that preserve wildcards (for Symm)
// If wild<0, this generates apg (-1) or SOF (-2) search strings instead (for Symm)
function Bin2Lib (f, start, dx, dy, width, height, wild) {
    if (wild < 0) {
	return wild === -1 ? Bin2Apg (f, start, dx, dy, width, height) :
			     Bin2Sof (f, start, dx, dy, width, height);
    }
    var n = 0;					// Number of accumulated blanks
    var result = String.fromCharCode (min (A_MAX, height+A_SP));
    result += String.fromCharCode (min (A_MAX, width+A_SP));
    for (var y = 0; y < height; ++y, start += dy) {
	var i = 0;
	for (var x = 0; x < width; ) {
	    var c = f.f_img[x++*dx+start];
	    if (wild) {
		result += c ? c<0 ? "?" : "O" : " ";
	    } else {
		i = 2*i + (c !== 0);
		if(! (x % 6)) {
		    if (i) {
			result += LibRun (n) + String.fromCharCode (i+A_SP);
			i = n = 0;
		    } else {
			++n;
		    }
		}
	    }
	}
	if (wild) {
	    result += ";";
	} else if (x %= 6) {
	    if (i) {
		result += LibRun (n) + String.fromCharCode ((i << (6-x)) + A_SP);
		n = 0;
	    } else {
		++n;
	    }
	}
    }
    return result;
}
// Add accumulated RLE run to output string. Line breaks are inserted as needed.
function RleWrite (line, n, c) {
    if (n) {
	var s = n > 1 ? "" + n + c : c;
	return line.length + s.length > 70 ? [line+"\n", s] : line + s;
    }
    return line;
}
// Add a single cell to the image
function ImageCell (ctx, f, x, y, m, net, c, p, bg, avg) {
    if (f && x < f.f_wid && y < f.f_hgt) {	// Add to stamp field
	var i = y*f.f_wid + x;
	var d = c - f.f_img[i];
	f.f_maxp += d;
	f.f_minp += d;
	f.f_img[i] = c;
    }
    if (ctx && c) {				// Draw on canvas (live only)
	if (m < 0) {				// Stamp
	    p = 0;
	    if ((m = ~m) >= 4) {
		++p;
	    }
	    DrawRect (ctx, x*m+p, y*m+p, m-p, m-p, C_STAMP_ALIVE);
	} else {				// Image
	    p *= 2;
	    x = m*x + p;
	    y = m*y + p;
	    m -= p;
	    if (avg) {				// Averaged color
		var r = bg>>16 & 0xFF;
		var g = bg>>8 & 0xFF;
		var b = bg & 0xFF;
		bg += round (c*((C_img_alive>>16 & 0xFF)-r)) * 0x10000 +
		  round (c*((C_img_alive>>8 & 0xFF)-g)) * 0x100 +
		  round (c*((C_img_alive & 0xFF)-b)) + 0x1000000;
		c = "#" + bg.toString (16).substring (1);
	    } else {				// Discrete cell color
		c = c < 0 ? C_IMG_WILD : C_IMG_ALIVE;
	    }
	    DrawRect (ctx, x, y, m, m, c);
	}
    }
}
// Convert a library-format pattern (or a piece thereof) to screen or file
// (If p===null, field f is displayed instead)
// fmt: >=0: to text string, -1=on screen, ~m=draw stamp w/magnification m
// For browsers with HTML5 canvas support, a canvas is used to draw the image
// For earlier browers, a table is used instead (stamp is never drawn with tables)
// (NOTE: To avoid multi-minute waits for huge patterns, table display is
//  currently suppressed for patterns 80 cells and wider)
// pad is either 0 or 1, and must be zero unless fmt===-1.
//
// The following parameter combinations are currently used:
// (c, ctx, null*, r, p, X_IMAGE, ... 1, 1, 1, "", bg);			Draw thumbnail p in result table
// (null, null, null*, r, p, fmt, ... 0, 0, 0, comm, bg)		Return pattern p as text/RLE/Life 1.06 string
// ("canimg", ctx, ctx, null*, r, p, X_IMAGE, ... pad, pad, pad, "", bg) Draw pattern p on canvas
// (null, ctx, stampf, r, p, ~m, ... u+20/m, v+20/m, 0, "", bg)		Draw pattern p on stamp canvas*
// (*Note that in all cases except the last one, replacing (null, r, p) by
//  (f, r, null) will use field f rather than pattern p.)
function Convert (tab, ctx, f, r, p, fmt, boxw, boxh, lft, top, pad, comm, bg, bgi) {
    var pat;					// Pattern image
    var i = 0;					// Index into library string
    var h;					// Height
    var w;					// Width
    var tr;					// Table row
    var field = !p;				// Convert from field instead?
    if (field) {				// Convert from field
	p = f;
	f = null;
	pat = p.f_img;
	w = p.f_rgt - p.f_lft;
	h = p.f_btm - p.f_top;
    } else {					// Convert from library pattern
	pat = GetFirst (p.p_img);
	if (pat === HUGEPAT) {			// Non-dead pattern is missing:
	    if (fmt === X_IMAGE) {		// It must be ridiculously huge
		ShowB ("viewexport", false);	// (e.g. Gemini)
		ShowB ("canimg", false);
		imaged = null;
	    }
	    return sTooLarge + ".";
	}
	h = pat.charCodeAt (i++) - A_SP;
	w = pat.charCodeAt (i++) - A_SP;
	if (w <= 0) {				// Very wide pattern
	    w = p.p_boxw;
	}
	if (w <= 0) {				// Very tall pattern
	    h = p.p_boxh;
	}
    }
    var m = max (w, h);				// Largest dimension
    if (m > LARGE) {				// Ignore really huge patterns
	w = h = 0;
    }
    m = min ((boxw-2) / (w + 2*pad), (boxh-2) / (h + 2*pad));	// Ideal magnification
    var q = boxw > 1 ? ceil (1/m) : 1;		// Minimum discrete reduction
    m = floor (m);				// Maximum discrete magnification
    m = max (1, min (MAXZOOM, m));		// Net magnification
    if (fmt < X_IMAGE) {			// Stamps pre-select magnification
	m = fmt;
    }
    var g = m >= 5;				// Cells wide enough for grid?
    var img = ctx && fmt < 0;			// Display image?
    var net = m - 2*g;				// Net cell size
    var n = 0;					// Number of queued-up spaces
    var k;					// Next 6 bits
    var rlen = 0;				// # of RLE cells
    var rled = 0;				// # of RLE newlines
    var rlec = "b";				// type of RLE cell
    var rlel = "";				// Line for outputing RLE or text
    var rlef = "";				// Entire file for outputing RLE or text
    if (img && fmt === X_IMAGE) {		// Image: size canvas, and draw grid
	SetWidth (tab, x = ceil (m*(w+2*pad)/q+2));
	SetHeight (tab, y = ceil (m*(h+2*pad)/q+2));
	// NOTE: This is a kludge, just for Opera 9 (and any other browsers
	// that don't respect resizing of canvases under program control)
	// that erases the whole initial canvas, in case any of it is still
	// visible even though it shouldn't be. Sigh.
	DrawRect (ctx, 0, 0, boxw, boxh, bg);
//	DrawRect (ctx, 0, 0, x, y, bg);
	if (g && boxw >= SCRWIDTH) {		// Draw grid lines
	    for (y = 0; y <= h+2; ++y) {	    // Draw horizontal grid lines
		DrawRect (ctx, 0, m*y, (m*(w+2*pad)+2), 2, C_IMG_GRID);
	    }
	    for (x = 0; x <= w+2; ++x) {		// Draw vertical grid lines
		DrawRect (ctx, m*x, 0, 2, (m*(h+2*pad)+2), C_IMG_GRID);
	    }
	}
    }
    if (q > 1) {
	var s = [];				// sums for reduction
	for (x = 0; x <= w/q; ++x) {
	    s[x] = 0;
	}
    }
    for (var y = 0; y < h; ++y) {
	for (var x = 0; x < w; ++x, k <<= 1) {
	    var c;				// Cell value
	    if (field) {			// Convert field
		c = pat[(y+p.f_top)*p.f_wid+x+p.f_lft];
	    } else {				// Convert library pattern
		if (x%6 === 0) {
		    if (n < 0) {		// Coasting on stored newline
			k = 0;
		    } else if (n) {		// Coasting on stored blanks
			--n;
			k = 0;
		    } else if (i >= pat.length) {	// End of pattern
			k = 0;
		    } else if ((k = pat.charCodeAt (i++) - A_SP) >= A_RUN || k < 0) {
			n = k-A_RUN+2 - 1;	// Blank run or newline
			k = 0;
		    }				// Otherwise, 6 bits of data
		}
		c = (k >> 5) & 1;		// Cell value
	    }
	    switch (fmt) {
	    case X_CELLS:			// Text cell
	    case X_LIFE105:			// Life 1.05 cell
		if (c) {			// Living Life 1.05 cell
		    for (; rlen; --rlen) {
			rlel += ".";
		    }
		    rlel += (c < 0 ? "?" : (fmt === X_LIFE105 ? "*" : "O"));
		} else {			// Dead Life 1.05 cell
		    ++rlen;
		}
		break;
	    case X_LIFE106:			// Life 1.06 cell
		if (c) {
		    rlef += (x-floor(w/2)) + " " + (y-floor(h/2)) + "\n";
		}
		break;
	    case X_RLE:				// RLE cell
		if (c) {			// Living RLE cell
		    if (rled) {
			rlel = RleWrite (rlel, rled, "$");
			rled = 0;
			if (IsArray (rlel)) {	// RLE line wrapped
			    rlef += rlel[0];
			    rlel = rlel[1];
			}
		    }
		}
		c = c ? (c < 0 ? "?" : "o") : "b";
		if (rlec !== c) {
		    if (rlen) {
			rlel = RleWrite (rlel, rlen, rlec);
			rlen = 0;
		    }
		    rlec = c;
		}
		++rlen;
		if (IsArray (rlel)) {		// RLE line wrapped
		    rlef += rlel[0];
		    rlel = rlel[1];
		}
	    }
	    if (img) {				// Image cell
		if (q > 1) {			// Reduce square of several cells into one
		    var d = floor (x / q);
		    s[d] += c !== 0;
		    if ((y+1)%q === 0 && (x+1)%q === 0) {
			ImageCell (ctx, f, lft+d, top+floor (y/q), m, net, s[d]/q/q, g, bgi, 1);
			s[d] = 0;
		    }
		} else {			// Single discrete cell
		    ImageCell (ctx, f, lft+x, top+y, m, net, c, g, bg);
		}
	    }
	}
	switch (fmt) {
	case X_CELLS:				// Text end of line
	case X_LIFE105:				// Life 1.05 end of line
	    rlef += rlel + "\n";
	    rlel = "";
	    rlen = 0;
	    break;
	case X_RLE:				// RLE end of line
	    if (rlen > 0 && rlec !== "b") {
		rlel = RleWrite (rlel, rlen, rlec);
	    }
	    rlen = 0;
	    ++rled;
	    if (IsArray (rlel)) {		// RLE line wrapped
		rlef += rlel[0];
		rlel = rlel[1];
	    }
	    break;
	}
	if (w % q) {				// Draw right partial reduced cell
	    d = floor (w / q);
	    ImageCell ( ctx, f, lft+d, top+floor(y/q), m, net, s[d]/q/q, g, bgi, 1);
	    s[d] = 0;
	}
	if (n < 0) {				// Reset newline status
	    n = 0;
	}
    }
    if (h % q) {				// Draw bottom partial reduced row
	d = floor (h / q);
	for (x = 0; x <= w/q; ++x) {
	    ImageCell (ctx, f, lft+x, top+d, m, net, s[x]/q/q, g, bgi, 1);
	}
    }
    switch (fmt) {
    case X_CELLS:				// Text end of field
	rlef = ("\n"+comm).replace (/\n#[a-zA-Z]/gm, "\n!").substring (1) + rlef;
	break;
    case X_LIFE105:				// Life 1.05 end of field
	rlef = s_Life_1_05 + "\n" + comm + rlef;
	break;
    case X_LIFE106:				// Life 1.06 end of field
	rlef = s_Life_1_06 + "\n" + comm + rlef;
	break;
    case X_RLE:					// RLE end of field
	if (rlen > 0) {
	    rlel = RleWrite (rlel, rlen, "o");
	    rlen = 0;
	    if (IsArray (rlel)) {		// RLE line wrapped
		rlef += rlel[0];
		rlel = rlel[1];
	    }
	}
	rlel = RleWrite (rlel, 1, "!");
	if (IsArray (rlel)) {			// RLE line wrapped
	    rlef += rlel[0];
	    rlel = rlel[1];
	}
	rlef = comm + "x = " + w + ", y = " + h +
	  (rulerle[r] !== "" ? ", rule = " + rulerle[r] : "") +
	  "\n" + rlef + rlel + "\n";
    }
    return rlef;
}
// Draw pattern image
function Image (f, r, p, file) {
    if (ifcan && Convert ("canimg", canctx, f, r, p, X_IMAGE,
      max (SCRWIDTH, aperture[0]), max (SCRWIDTH, aperture[1]),
      1, 1, 1, "", C_BG, C_bg).length === 0) {
	ShowB ("viewexport", true);
	ShowB ("canimg", ifcan);
	imaged = [f, r, p, file];
	SetDownload ("canimg", file + ".png");	// Set name for context to be saved as .png
    }
}
//------------------------------ UI display functions --------------------------
// Localize a string representing a number
function LocalNum (n) {
    return ("" + n).replace (/\./g, sDecimal);
}
// Convert an order number into a string
function OrdName (o, p, u) {
    return o !== floor (o) || o < -3 || o > 3 ?
	(o < 0 ? "/" : "") + "t^" + RealName (abs (o), p, 0, u) : ordnames[3+o];
}
// Compute short symbolic name for a real number
// p=k: maximum k digits; p=_: unlimited digits; p=-1: ASCII unlimited digits
// p=-2: gliders; p=-k: rarity/slope w/k-2 digits (i.e. ? => N/A)
// p<0 may also include user-generated numbers (that can include negatives)
function RealName (n, p, o, u) {
    if (isNaN (n)) {
	return u || sUnknown;
    } else if (n === _) {
	return p < -1 ? u : p < 0 ? sInfinity : Uinf;
    } else if (n === -_) {			// -_ never occurs internally
	return "-" + sInfinity;
    } else if (n >= KNOWN && p === -2) {	// Glider numbers
	if (n >= UNKNOWN) {
	    n -= UNKNOWN;
	    p = sUnknown;
	} else if (n >= TBD) {
	    n -= TBD;
	    p = sTBD;
	} else {
	    n -= KNOWN;
	    p = sKnown;
	}
	return n ? p + n : p;
    }
    if (n < 0) {
	return "-" + RealName (-n, p > 0 ? p-1 : p, o, u);
    }
    if (p < 0) {				// Infinite digits
	p = _;
    }
    p = min (p, decdigits);			// Never display more digits than user wants
    if (numfmt >= N_RAT) {			// Display as rational?
	var q = Rational (n, CT);
	if (q[1] !== 1) {			// n/1 => 1
	    q = RatName (q[0], q[1], p, false, o, u);
	    if (q) {
		return q;
	    }
	}
    }
    var s = OrdName (o, p, u);			// Suffix based on order
    if (n === 1 && o > 0) {			// reduce 1t to just t
	return s;
    }
    p -= s.length;
    if (p < _) {				// Constrain to p characters
	var l = n <= 0 ? 0 : floor (log (n) / LN10);
	if (l < -1) {				// Small scientific notation
	    l = -l;
	    return RealName (n * pow (10, l), p-3-(l>9)-(l>99), 0, u) + "e-" + l + s;
	} else if (l+1 < p) {			// Room for decimals
	    l = pow (10, p-l-1);
	    n = round (n * l) / l;
	} else if (l+1 === p) {			// Integer will fit exactly
	    n = round (n)
	} else {				// Large scientific notation
	    return RealName (n / pow (10, l-1), p-2-(l>9)-(l>99), 0, u) + "e" + l + s;
	}
    }
    return LocalNum (n + s);
}
// Display a rational number. Numerator and denominator are nonnegative integers,
// including _ or NaN, but not necessarily in lowest terms
// By convention, n/NaN is treated as 0, n/0 is treated as infinity, and n/n is treated as 1.
function RatName (n, d, p, realok, o, u) {
    if (n === d) {				// n/n, 0/0, _/_ => 1 (but not ?/?)
	n = d = 1;
    } else if (n === 0 || isNaN (d) && !isNaN (n)) {	// 0/n, 0/_, n/? => 0 (but not ?/?)
	n = 0;
	d = 1;
    } else if (d === 0) {			// n/0, ?/0 => _
	n = _;
	d = 1;
    } else if (isNaN (n) || isNaN (d) || n === _ || d === _) {	// ?/?, ?/n, n/_, _/? => real
    } else if (d === 1) {			// n/1 => n
    } else if (numfmt >= N_RAT) {		// use rational
	var g = GCD (n, d, CT);
	n = round (n/g);			// Round in case of floating-point inexactness
	d = round (d/g);
	if (d !== 1) {
	    var i = 0;				// Integer part
	    var f = n;				// Fraction part
	    if (numfmt === N_MIXED && n > d && !o) {	// Mixed number?
		i = Floor (n / d);			// 3/2 -> 1 1/2
		f = n - i*d;			// 3/2 t cannot happen
	    }					// 3/2 t^-1 -> 3/2t
	    f = !i && f === 1 && o > 0 ? OrdName (o, p, u) : RealName (f, p, max (o, 0), u);
	    d = !i && f === 1 && o < 0 ? OrdName (-o, p, u) : RealName (d, p, max (-o, 0), u);
	    var x = f.length
	    var y = d.length
	    var s = "";				// Fractional string
	    var u = "";				// Fractional character
	    if (f === "1" && d === "4") {		// 1/4
		s = u = Ufrac14;
	    } else if (f === "1" && d === "2") {	// 1/2
		s = u = Ufrac12;
	    } else if (f === "3" && d === "4") {	// 3/4
		s = u = Ufrac34;
	    } else if (x+y < p) {			// f/d
		s = f + "/" + d;
	    } else if (x < p) {			// f/ d
		s = f + "/ " + d;
	    } else if (y < p) {			// f /p
		s = f + " /" + d;
	    } else if (x <= p && y <= p) {	// f / p
		s = f + " / " + d;
	    }					// too large: use scientific notation
	    if (s.length) {
		if (!i) {			// proper fraction
		    return s;
		}
		i = RealName (i, p, o, u);
		return i + (u.length && i.length<p ? "" : " ") + s;
	    }
	}
    }
    return realok ? RealName (n/d, p, o, u) : undefined;
}
// Encode a string for safe inclusion in JS
function EncodeJsString (s) {
    return s.replace (/\\/g, "\\\\").replace (/'/g, "\\'");
}
// Add a cell to the object list table
// hdr: 0=normal, n+1=table heading, -1=wide rule subheading
function AddCell (tr, x, txt, r, o, url, target, bold, hdr, w, span, sort, col) {
    var td = ReuseCell (tr, x);			// New table cell
    SetWidth (td, w);
    SetBold (td, bold);				// Set boldface
    SetColSpan (td, span);			// Set number of columns
    SetBg (td, col);				// Set background color
    if (hdr > 0) {				// Column header: Sort buttons
	url = js + "Column(" + sort + "," + (sort === defsort1 ? -sortdir1 : 1) + ")";
    } else if (hdr < 0) {			// Rule header: Expand/collapse rule list
	url = js + "Collapse(" + r + ")";
    } else {					// Patterns: Select pattern, perhaps more
	url = js + "Found(" + r + "," + o +
	  (url && url !== "" ? ",'" + EncodeJsString (url) +  "'" +
	  (target !== "" ? ",'" + target + "'" : "") : "") + ")";
    }
    if (txt) {					// Embed text in URL, if necessary
	AddChild (AddAnchor (td, url, target, "j"), TextNode (txt));
    }
    return td;
}
// Draw a thumbnail image in the results table
function DrawThumb (c, r, p, bg, bgi) {
    Convert (c, GetContext (c, "2d"), null, r, p, X_IMAGE,
      IMGWIDTH, IMGHEIGHT, 1, 1, 1, "", bg, bgi);
}
// Generate a symmetry string
function SymmName (s, p, q) {
    return s + (q ? p.p_GetPar (s.indexOf ("_") < 0 ? "_" : "", "") : "");
}
// Return pseudo- or quasi- object prefix
function Pprefix (p) {
    return p.p_cid === O_QSTILL || p.p_cid === O_QOSC || p.p_cid == O_QSS ? "q" :
	   p.p_cid === O_PSTILL || p.p_cid === O_POSC || p.p_cid == O_PSS ? "p" : "";
}
// Convert a number of gliders into a page URL, if appropriate
function GlsUrl (g, p, x, h) {
    var u = g > x ? g <= UNKNOWN ? g < UNKNOWN ? g < TBD ? g < KNOWN ?  g < h ? g <= p ? g < p ?
      "" : "e" : "g" : "x" : "sClickKnown" : "sClickTbd" : "u" : "p" : ""+g;
    return u.length ? u.length > 1 ? js + "alert(" + u + ")" : "glider-" + u + ".htm" : u;
}
// Add a row to the object list table
// hdr: 0=normal, 1=table heading, -1=wide rule subheading, -2=wide comment
function AddRow (tab, y, p, r, o, bold, hdr, col) {
    var tr = ReuseRow (tab, y);			// New table row
    TruncRow (tr, 0);
    var u = p.p_U && p.p_U () ? sN_A : sUnknown;	// What unknown means
    var i, j;
    if (hdr >= 0) {				// Data line
	var x = 0;				// Horizontal space used
	var life = r === R_B3S23;		// Is object in the Life rule?
	var n = !IsString (p.p_minp);		// Is this numeric (i.e. not header text)?
	if (viscol[S_MINP]) {
	    var w = 0;
	    if (n && life && p.p_minp && (p.p_minp < LG || (1<<p.p_cid) & OM_LG ||
	      p.p_cid === O_OSC && perpage.indexOf (p.p_per) >= 0)) {
		w = "bits-" + (p.p_minp < LG ? p.p_minp : "lg") + ".htm";
	    }
	    AddCell (tr, x++, n ? RealName (p.p_minp, 7, 0, u) : p.p_minp,
	      r, o, w, 0, bold, hdr, 56, 1, S_MINP, C_BG);
	}
	if (viscol[S_AVGP]) {
	    AddCell (tr, x++, n ? OrderName (p.p_avgp, p.p_per, 7, u) : p.p_avgp,
	      r, o, 0, 0, bold, hdr, 56, 1, S_AVGP, C_BG);
	}
	if (viscol[S_MAXP]) {
	    AddCell (tr, x++, n ? OrderName (p.p_maxp, p.p_per, 7, u) : p.p_maxp,
	      r, o, 0, 0, bold, hdr, 56, 1, S_MAXP, C_BG);
	}
	if (viscol[S_RPOP]) {
	    AddCell (tr, x++, n ? RatOrderName (p.p_minp, p.p_maxp, p.p_per, 7, u) : p.p_rpop,
	      r, o, 0, 0, bold, hdr, 56, 1, S_RPOP, C_BG);
	}
	if (viscol[S_INF]) {
	    AddCell (tr, x++, n ? OrderName (p.p_inf, p.p_per, 7, u) : p.p_inf,
	      r, o, 0, 0, bold, hdr, 56, 1, S_INF, C_BG);
	}
	if (viscol[S_DEN]) {
	    AddCell (tr, x++, n ? RatOrderName (p.p_minp, p.p_inf, p.p_per, 7, u) : p.p_den,
	      r, o, 0, 0, bold, hdr, 56, 1, S_DEN, C_BG);
	}
	if (viscol[S_ADEN]) {
	    AddCell (tr, x++, n ? RatOrderName (p.p_avgp, p.p_inf, p.p_per, 7, u) : p.p_aden,
	      r, o, 0, 0, bold, hdr, 56, 1, S_ADEN, C_BG);
	}
	if (viscol[S_MDEN]) {
	    AddCell (tr, x++, n ? RatOrderName (p.p_maxp, p.p_inf, p.p_per, 7, u) : p.p_mden,
	      r, o, 0, 0, bold, hdr, 56, 1, S_MDEN, C_BG);
	}
	if (viscol[S_HEAT]) {
	    AddCell (tr, x++, n ? OrderName (p.p_heat, p.p_per, 7, u) : p.p_heat,
	      r, o, 0, 0, bold, hdr, 56, 1, S_HEAT, C_BG);
	}
	if (viscol[S_TEMP]) {
	    AddCell (tr, x++, n ? RealName (p.p_temp, 7, 0, u) : p.p_temp,
	      r, o, 0, 0, bold, hdr, 56, 1, S_TEMP, C_BG);
	}
	if (viscol[S_VOL]) {
	    AddCell (tr, x++, n ? RealName (p.p_vol, 7, 0, sN_A) : p.p_vol,
	      r, o, 0, 0, bold, hdr, 56, 1, S_VOL, C_BG);
	}
	if (viscol[S_SVOL]) {
	    AddCell (tr, x++, n ? RealName (p.p_svol, 7, 0, sN_A) : p.p_svol,
	      r, o, 0, 0, bold, hdr, 56, 1, S_SVOL, C_BG);
	}
	if (viscol[S_RVOL]) {
	    AddCell (tr, x++, n ? RatName (p.p_svol, p.p_vol, 7, true, 0, sN_A) : p.p_rvol,
	      r, o, 0, 0, bold, hdr, 56, 1, S_RVOL, C_BG);
	}
	if (viscol[S_SYMM]) {
	    AddCell (tr, x++, n ? (i = p.p_GetSymm (),
	      SymmName (symmnames[i], p, i !== Y_C1 && i !== Y_D2X)) : p.p_symm,
	      r, o, 0, 0, bold, hdr, 56, 1, S_SYMM, C_BG);
	}
	if (viscol[S_GLIDE]) {
	    AddCell (tr, x++, n ? (i = p.p_GetSymm (), j = p.p_GetGlide (),
	      SymmName (symmnames[i], p, j !== Y_C1 && j !== Y_D2X || i === Y_D2X && j === Y_D2X)) : p.p_glide,
	      r, o, 0, 0, bold, hdr, 56, 1, S_GLIDE, C_BG);
	}
	if (viscol[S_BOXW]) {
	    AddCell (tr, x++, n ? RealName (p.p_boxw, 7, 0, u) : p.p_boxw,
	      r, o, 0, 0, bold, hdr, 56, 1, S_BOXW, C_BG);
	}
	if (viscol[S_BOXH]) {
	    AddCell (tr, x++, n ? RealName (p.p_boxh, 7, 0, u) : p.p_boxh,
	      r, o, 0, 0, bold, hdr, 56, 1, S_BOXH, C_BG);
	}
	if (viscol[S_BOXD]) {
	    AddCell (tr, x++, n ? OrderDiag (p.p_boxw, p.p_boxh, p.p_per, 7, u) : p.p_boxd,
	      r, o, 0, 0, bold, hdr, 56, 1, S_BOXD, C_BG);
	}
	if (viscol[S_BOXC]) {
	    AddCell (tr, x++, n ? RealName (2*(p.p_boxw+p.p_boxh), 7, 0, u) : p.p_boxc,
	      r, o, 0, 0, bold, hdr, 56, 1, S_BOXC, C_BG);
	}
	if (viscol[S_BOXA]) {
	    AddCell (tr, x++, n ? RealName (p.p_boxw*p.p_boxh, 7, 0, u) : p.p_boxa,
	      r, o, 0, 0, bold, hdr, 56, 1, S_BOXA, C_BG);
	}
	if (viscol[S_BOXS]) {
	    AddCell (tr, x++, n ? RatName (p.p_boxh, p.p_boxw, 7, true, 0, u) : p.p_boxs,
	      r, o, 0, 0, bold, hdr, 56, 1, S_BOXS, C_BG);
	}
	if (viscol[S_LBOXW]) {
	    AddCell (tr, x++, n ? OrderName (p.p_lboxw, p.p_per, 7, u) : p.p_lboxw,
	      r, o, 0, 0, bold, hdr, 56, 1, S_LBOXW, C_BG);
	}
	if (viscol[S_LBOXH]) {
	    AddCell (tr, x++, n ? OrderName (p.p_lboxh, p.p_per, 7, u) : p.p_lboxh,
	      r, o, 0, 0, bold, hdr, 56, 1, S_LBOXH, C_BG);
	}
	if (viscol[S_LBOXD]) {
	    AddCell (tr, x++, n ? OrderDiag (p.p_lboxw, p.p_lboxh, p.p_per, 7, u) : p.p_lboxd,
	      r, o, 0, 0, bold, hdr, 56, 1, S_LBOXD, C_BG);
	}
	if (viscol[S_LBOXC]) {
	    AddCell (tr, x++, n ? OrderName (OrderMul (2,
	      OrderAdd (p.p_lboxw, p.p_lboxh)), p.p_per, 7, u) : p.p_lboxc,
	      r, o, 0, 0, bold, hdr, 56, 1, S_LBOXC, C_BG);
	}
	if (viscol[S_LBOXA]) {
	    AddCell (tr, x++, n ? OrderName (OrderMul (p.p_lboxw, p.p_lboxh), p.p_per, 7, u) : p.p_lboxa,
	      r, o, 0, 0, bold, hdr, 56, 1, S_LBOXA, C_BG);
	}
	if (viscol[S_LBOXS]) {
	    AddCell (tr, x++, n ? RatOrderName (p.p_lboxh, p.p_lboxw, p.p_per, 7, u) : p.p_lboxs,
	      r, o, 0, 0, bold, hdr, 56, 1, S_LBOXS, C_BG);
	}
	if (viscol[S_HULLW]) {
	    AddCell (tr, x++, n ? OrderName (p.p_hullw, p.p_per, 7, u) : p.p_hullw,
	      r, o, 0, 0, bold, hdr, 56, 1, S_HULLW, C_BG);
	}
	if (viscol[S_HULLH]) {
	    AddCell (tr, x++, n ? OrderName (p.p_hullh, p.p_per, 7, u) : p.p_hullh,
	      r, o, 0, 0, bold, hdr, 56, 1, S_HULLH, C_BG);
	}
	if (viscol[S_HULLD]) {
	    AddCell (tr, x++, n ? OrderDiag (p.p_hullw, p.p_hullh, p.p_per, 7, u) : p.p_hulld,
	      r, o, 0, 0, bold, hdr, 56, 1, S_HULLD, C_BG);
	}
	if (viscol[S_HULLC]) {
	    AddCell (tr, x++, n ? OrderName (OrderMul (2,
	      OrderAdd (p.p_hullw, p.p_hullh)), p.p_per, 7, u) : p.p_hullc,
	      r, o, 0, 0, bold, hdr, 56, 1, S_HULLC, C_BG);
	}
	if (viscol[S_HULLA]) {
	    AddCell (tr, x++, n ? OrderName (OrderMul (p.p_hullw, p.p_hullh), p.p_per, 7, u) : p.p_hulla,
	      r, o, 0, 0, bold, hdr, 56, 1, S_HULLA, C_BG);
	}
	if (viscol[S_HULLS]) {
	    AddCell (tr, x++, n ? RatOrderName (p.p_hullh, p.p_hullw, p.p_per, 7, u) : p.p_hulls,
	      r, o, 0, 0, bold, hdr, 56, 1, S_HULLS, C_BG);
	}
	if (viscol[S_RBOXW]) {
	    AddCell (tr, x++, n ? RealName (p.p_GetRwidth (), 7, 0, sN_A) : p.p_rboxw,
	      r, o, 0, 0, bold, hdr, 56, 1, S_RBOXW, C_BG);
	}
	if (viscol[S_RBOXH]) {
	    AddCell (tr, x++, n ? RealName (p.p_GetRheight (), 7, 0, sN_A) : p.p_rboxh,
	      r, o, 0, 0, bold, hdr, 56, 1, S_RBOXH, C_BG);
	}
	if (viscol[S_RBOXD]) {
	    AddCell (tr, x++, n ? OrderDiag (p.p_GetRwidth (), p.p_GetRheight (), p.p_per, 7, sN_A) : p.p_rboxd,
	      r, o, 0, 0, bold, hdr, 56, 1, S_RBOXD, C_BG);
	}
	if (viscol[S_RBOXC]) {
	    AddCell (tr, x++, n ? RealName (2*(p.p_GetRwidth ()+p.p_GetRheight ()), 7, 0, sN_A) : p.p_rboxc,
	      r, o, 0, 0, bold, hdr, 56, 1, S_RBOXC, C_BG);
	}
	if (viscol[S_RBOXA]) {
	    AddCell (tr, x++, n ? RealName (p.p_GetRwidth ()*p.p_GetRheight (), 7, 0, sN_A) : p.p_rboxa,
	      r, o, 0, 0, bold, hdr, 56, 1, S_RBOXA, C_BG);
	}
	if (viscol[S_RBOXS]) {
	    AddCell (tr, x++, n ? RatName (p.p_GetRheight (), p.p_GetRwidth (), 7, true, 0, sN_A) : p.p_rboxs,
	      r, o, 0, 0, bold, hdr, 56, 1, S_RBOXS, C_BG);
	}
	if (viscol[S_ACT]) {
	    AddCell (tr, x++, n ? RealName (p.p_GetAct (), 7, 0, sN_A) : p.p_act,
	      r, o, 0, 0, bold, hdr, 56, 1, S_ACT, C_BG);
	}
	if (viscol[S_NROT]) {
	    AddCell (tr, x++, n ? RealName (p.p_GetNrotors (), 7, 0, sN_A) : p.p_nrotors,
	      r, o, 0, 0, bold, hdr, 56, 1, S_NROT, C_BG);
	}
	if (viscol[S_PER]) {
	    w = 0;
	    if (n && (p.p_cid <= O_QOSC || life && p.p_cid === O_METH)) {
		w = Pprefix (p);
		if (!life) {
		    w = rulepage[r] + ".htm#" + Dash (rulesec[r], w + ("p" + p.p_per));
		} else if (p.p_cid === O_METH) {
		    w = url_meth + "#meth-p" + p.p_per;
		} else {
		    w += (perpage.indexOf (p.p_per) >= 0 ? "p"+p.p_per : "period") + ".htm";
		}
	    }
	    i = RealName (p.p_per, 7, 0, u);
	    j = p.p_GetRmod ();
	    AddCell (tr, x++, n ? i + (j!==1 ? (i.length>3?" ":"") + "(/"+j+")" : "") :
	      p.p_per, r, o, w, 0, bold, hdr, 56, 1, S_PER, C_BG);
	}
	if (viscol[S_MOD]) {
	    AddCell (tr, x++, n ? RealName (p.p_per/p.p_GetRmod (), 7, 0, u) : p.p_mod,
	      r, o, 0, 0, bold, hdr, 56, 1, S_MOD, C_BG);
	}
	if (viscol[S_RMOD]) {
	    AddCell (tr, x++, n ? ""+p.p_GetRmod () : p.p_rmod,
	      r, o, 0, 0, bold, hdr, 56, 1, S_RMOD, C_BG);
	}
	if (viscol[S_VEL]) {
	    w = 0;
	    if (n && p.p_veld > 0) {
		var q = p.p_velx>1 ? p.p_velx : "";	// prefix
		var v;					// velocity section
		if (p.p_veld === 6) {			// oblique section
		    v = "k6";
		} else if (p.p_veld === 79) {
		    v = "wb";
		} else if (p.p_velx === 6) {
		    v = "hbk";
		} else {
		    v = "gemini";
		}
		v = p.p_vely ? p.p_vely !== p.p_velx ? v :
		  q + "d" + p.p_veld : q + "o" + p.p_veld;
		if (life) {				// Life spaceships have sections by velocity
		    w = p.p_cid === O_SS ? "exotic.htm#ss-" + v : catlist[p.p_cid] + ".htm";
		} else {				// Other rules have their own sections (or generic, if unknown pattern entered)
		    w = rulepage[r] + ".htm#" + Dash (rulesec[r],
		      p.p_hid >= 0 ? rulelib[r][this.p_hid].h_sec : catlist[p.p_cid]);
		}
	    }
	    j = "0";
	    if (n && p.p_velx) {
		j = (p.p_velx !== 1 ? p.p_velx : "") + "c" +
		  (p.p_veld !== 1 ? "/" + p.p_veld : "");
		if (p.p_vely === 0) {			// orthogonal
		    j += " " + so;
		} else if (p.p_vely === p.p_velx) {	// diagonal
		    j += " " + sd;
		} else {				// oblique
		    j = "(" + RealName (p.p_velx, 5, 0) + ", " +
		      RealName (p.p_vely, 4, 0) + ")c/ " +
		      RealName (p.p_veld, 7, 0);
		}
	    }
	    AddCell (tr, x++, n ? j : p.p_veld, r, o, w, 0, bold, hdr, 56, 1, S_VEL, C_BG);
	}
	if (viscol[S_SLP]) {
	    AddCell (tr, x++, n ? RealName (p.p_GetSlope(), 7, 0, sN_A) : p.p_slp,
	      r, o, 0, 0, bold, hdr, 56, 1, S_SLP, C_BG);
	}
	if (viscol[S_GLS]) {
	    AddCell (tr, x++, n ? GlsName (p.p_gls, sKnown, sTBD) : p.p_gls,
	      r, o, n && life && GlsUrl (p.p_gls, p.p_minp, 7, 100), 0,
	      bold, hdr, 56, 1, S_GLS, col);
	}
	if (viscol[S_RGLS]) {
	    AddCell (tr, x++, n ? (p.p_gls >= KNOWN ?
	      GlsName (floor (p.p_gls/KNOWN)*KNOWN, sKnown, sTBD) :
	      RatName (p.p_gls, p.p_minp, 7, true, 0, sTBD)) : p.p_rgls,
	      r, o, n && life && GlsUrl (p.p_gls, p.p_minp, 0, KNOWN), 0,
	      bold, hdr, 56, 1, S_RGLS, col);
	}
	if (viscol[S_GLNA]) {
	    AddCell (tr, x++, n ? p.p_glna ? RealName (p.p_glna, 7, 0, sN_A) : "" : p.p_glna,
	      r, o, n && p.p_glna && url_epp + ApgEpp (rulerle[r]) + "/",
	      "lifesrch_epp", bold, hdr, 56, 1, S_GLNA, C_BG);
	}
	if (viscol[S_GLNR]) {
	    AddCell (tr, x++, n ? p.p_glnr ? RealName (p.p_glnr, 7, 0, sN_A) : "" : p.p_glnr,
	      r, o, n && p.p_glnr && url_epp + ApgEpp (rulerle[r]) + "/",
	      "lifesrch_epp", bold, hdr, 56, 1, S_GLNR, C_BG);
	}
	if (viscol[S_FREQ]) {
	    AddCell (tr, x++, n ? RealName (p.p_freq/FREQBASE, 7, 0, sN_A) : p.p_freq,
	      r, o, p.p_GetCom (r), 0, bold, hdr, 56, 1, S_FREQ, C_BG);
	}
	if (viscol[S_RAR]) {
	    AddCell (tr, x++, n ? RealName (FREQBASE/p.p_freq, 7, 0, sN_A) : p.p_rar,
	      r, o, p.p_GetCom (r), 0, bold, hdr, 56, 1, S_RAR, C_BG);
	}
	if (viscol[S_TTS]) {
	    AddCell (tr, x++, n ? RealName (p.p_tts, 7, 0, u) : p.p_tts,
	      r, o, 0, 0, bold, hdr, 56, 1, S_TTS, C_BG);
	}
	if (viscol[S_EF]) {
	    AddCell (tr, x++, n ? RealName (p.p_GetEf (), 7, 0, u) : p.p_ef,
	      r, o, 0, 0, bold, hdr, 56, 1, S_EF, C_BG);
	}
	if (viscol[S_CAT]) {
	    w = 0;
	    if (n) {
		w = catlist[p.p_cid];
		if (life) {
		    if (p.p_cid === O_SS && p.p_minp >= LG) {
			i = p.p_hdr.h_sub;
			w = i.length < 3 && parseInt (i) > 0 ? "flotilla" : "exotic";
		    }
		    w += ".htm";
		} else {
		    w = rulepage[r] + ".htm#" + p.p_hdr.h_name;
		}
	    }
	    AddCell (tr, x++, n ? catabbrs[p.p_hdr.h_cid] : p.p_cid,
	      r, o, w, 0, bold, hdr, 56, 1, S_CAT, C_BG);
	}
	if (viscol[S_HDR]) {
	    w = 0;
	    if (n) {
		w = catpage[p.p_cid];		// Most categories are on their own pages
		i = p.p_hdr.h_name;		// Most categories use header name as HTML tag
		if (!life) {			// Other rules are on a single page
		    w = rulepage[r];
		} else if (p.p_cid === O_OSC) {
		    if (perpage.indexOf (p.p_per) >= 0) {	// osc#pn-c => pn#pn-c (for common)
			w = "p" + p.p_per;
		    } else {			// osc#pn-c => period#pn (for uncommon)
			w = "period";
			i = "p" + p.p_per;
		    }
		} else if (p.p_cid === O_QOSC) {	// qosc => qpn
		    w = "qp" + p.p_per;
		} else if (p.p_cid === O_POSC) {	// posc => ppn
		    w = "pp" + p.p_per;
		} else if (p.p_cid === O_SS && p.p_minp >= LG) {	// ss => flotilla (for some), exotic (for rest)
		    w = p.p_hdr.h_sub;
		    w = w.length < 3 && parseInt (w) > 0 ? "flotilla" : "exotic";
		}
		w += ".htm#" + i;
	    }
	    AddCell (tr, x++, n ? p.p_hdr.h_name : p.p_hdr,
	      r, o, w, 0, bold, hdr, 56, 1, S_HDR, C_BG);
	}
	if (viscol[S_NBR]) {
	    AddCell (tr, x++, n ? p.p_GetNbrs (r) : p.p_nbr,
	      r, o, 0, 0, bold, hdr, 56, 1, S_NBR, C_BG);
	}
	if (viscol[S_FILE]) {
	    AddCell (tr, x++, p.p_GetFile (), r, o, n && p.p_GetLocal (r), "lifesrch_rle",
	      bold, hdr, 56, 1, S_FILE, C_BG);
	}
	if (viscol[S_APG]) {
	    AddCell (tr, x++, p.p_GetApg (r).substring (0, 8),
	      r, o, n && p.p_GetGol (r), "lifesrch_apg", bold, hdr, 56, 1, S_APG, C_BG);
	}
	if (viscol[S_SOF]) {
	    AddCell (tr, x++, p.p_GetSof (r).substring (0, 8),
	      r, o, n && p.p_GetPent (r), "lifesrch_sof", bold, hdr, 56, 1, S_SOF, C_BG);
	}
	if (viscol[S_LIS]) {
	    AddCell (tr, x++, n ? p.p_GetLis (r).substring (0, 8) : p.p_lis,
	      r, o, n && "~" + p.p_GetLis (), n && p.p_GetFile (), bold, hdr, 56, 1, S_LIS, C_BG);
	}
	if (viscol[S_HRD]) {
	    AddCell (tr, x++, p.p_GetHrd (r).substring (0, 8),
	      r, o, 0, 0, bold, hdr, 56, 1, S_HRD, C_BG);
	}
	if (viscol[S_WIKI]) {
	    AddCell (tr, x++, p.p_GetWiki (r).substring (0, 8),
	      r, o, "", "lifesrch_wiki", bold, hdr, 56, 1, S_HRD, C_BG);
	}
	if (viscol[S_PAT]) {
	    AddCell (tr, x++, GetFirst (p.p_name), r, o, 0, 0, bold, hdr,
	      max (SCRWIDTH-3-COLWIDTH*x-IMGWIDTH*viscol[S_IMG], COLWIDTH), 1, S_PAT, C_BG);
	}
	if (viscol[S_IMG]) {
	    var c = AddCell (tr, x++, n ? undefined : p.p_img,
	    r, o, 0, 0, bold, hdr, 56, 1, S_IMG, C_BG);
	    if (n && GetFirst (p.p_img) !== HUGEPAT) {
		c = AddCanvas (c, js + "Found(" + r + "," + o + ")", "", IMGWIDTH, IMGHEIGHT);
		DrawThumb (c, r, p, C_BG, C_bg);
	    }
	}
    } else {					// One-element header line
	AddCell (tr, 0, p, r, o, 0, 0, bold, hdr, SCRWIDTH-3, nviscol, S_PAT, col);
    }
    return tr;
}
// View one of several search result classes
function View (index) {
    state = index;
    if (state < Z_HUGE) {		// Reset or searching...
	ShowB ("viewprop", false);
	ShowB ("viewexport", false);
	ShowB ("viewexported", false);
	ShowB ("canimg", false);
	imaged = null;
    }
    if (state < Z_MANY) {		// No specific result selected
	ShowB ("viewtab", false);
	ShowB ("viewstamp", false);
	ShowB ("viewnav", false);
	ShowB ("viewscroll", false);
	ShowB ("viewscroll2", false);
	ShowR ("viewname", false);
	ShowR ("viewlbox", false);
	ShowR ("viewhull", false);
	ShowR ("viewinf", false);
	ShowR ("viewden", false);
	ShowR ("viewrar", false);
	ShowR ("viewgls", false);
	ShowR ("viewheat", false);
	ShowR ("viewper", false);
	ShowR ("viewnbr", false);
	ShowR ("viewrot", false);
	ShowR ("viewtemp", false);
	ShowR ("viewtts", false);
	ShowR ("viewvel", false);
	ShowR ("viewvol", false);
	ShowR ("viewfile", false);
	ShowR ("viewcol", false);
	ShowR ("viewapg", false);
	SetText ("catobj", catobj = "");
	ShowR ("viewepp", false);
	ShowR ("viewwiki", false);
	ShowI ("gobits", false);
	ShowI ("txtpop", true);
    }
    var a = state === Z_LOADING || state === Z_SEARCH;	// loading...
    ShowI ("progsearch", a);
    ShowI ("spinsearch", a);
    Enable ("insearch", !a);
    a = state >= Z_NONE && selectb !== null;	// properties shown for all
    ShowR ("viewbox", a);
    ShowR ("viewsize", a);
    ShowR ("viewsymm", a);
}
// Convert one or more real numbers into a text string
function RealNames (n, p, m, u) {
    if (IsArray (n)) {			// List of numbers
	var c = " " + (m === M_EQ ? sor : sand) + " ";
	var a = "";
	for (var i = 0; i < n.length; ++i) {
	    a += c + RealName (n[i], p, 0, u);
	}
	return a.substring (c.length);
    } else {
	return RealName (n, p, 0, u);
    }
}
// Convert one or more rational velocities into a text string
function VelNames (n, d, m) {
    var c = " " + (m === M_EQ ? sor : sand) + " ";
    var a = "";
    if (IsArray (n)) {			// List of numerators
	for (var i = 0; i < n.length; ++i) {
	    a += c + VelNames (n[i], d, m);
	}
	return a.substring (c.length);
    } else if (IsArray (d)) {			// List of denominators
	for (var i = 0; i < d.length; ++i) {
	    a += c + VelNames (n, d[i], m);
	}
	return a.substring (c.length);
    } else {
	return RatName (n, d, _, true, 4, sN_A);
    }
}
// Convert an object's velocity into a user-readable text string
function VelName (p, o, d, k) {
    var v = "c";
    if (p.p_vely === 0) {
	if (p.p_velx > 1) {
	    v = "" + p.p_velx + v;
	}
	v = o + v;
    } else if (p.p_velx === p.p_vely) {
	if (p.p_velx > 1) {
	    v = "" + p.p_velx + v;
	}
	v = d + v;
    } else {
	v = k + "(" + p.p_velx + "," + p.p_vely + ")" + v;
    }
    if (p.p_veld > 1) {
	v += "/" + p.p_veld;
    }
    return v;
}
// Display a (possibly transfinite) number in terms of order of magnitude
function OrderName (x, q, p, u) {
    x = OrderPair (x, q);
    return RealName (x[0], p, x[1], u);
}
// Display a (possibly transfinite) circumference in terms of order of magnitude
function OrderCirc (w, h, q, p, u) {
    w = AddPair (OrderPair (w, q), OrderPair (h, q));
    return RealName (2*w[0], p, w[1], u);
}
// Display a (possibly transfinite) area in terms of order of magnitude
function OrderArea (w, h, q, p, u) {
    w = MulPair (OrderPair (w, q), OrderPair (h, q));
    return RealName (w[0], p, w[1], u);
}
// Display a (possibly transfinite) diagonal in terms of order of magnitude
function OrderDiag (w, h, q, p, u) {
    w = DiagPair (OrderPair (w, q), OrderPair (h, q));
    var s = sqrt (w[0]);
    var f = floor (s);
    return f === s || numfmt < N_RAT ? RealName (s, p, w[1], u) :
      Uradic + RealName (w[0], p, w[1], u);
}
// Display a (possibly transfinite) rational number in terms of order of magnitude
function RatOrderName (n, d, q, p, u) {
    n = OrderPair (n, q);
    d = OrderPair (d, q);
    var u = isNaN (n[0]);
    var v = isNaN (d[0]);
    var o = n[1] - d[1] - (v && !u);
    return RatName (u || v ? NaN : n[0], d[0], p, true, o, u);
}
// Provide description line for bounding boxes
function BoxName (w, h, p, u, q) {
    return OrderName (w, p, _, u) + " " + Utimes + " " + OrderName (h, p, _, u) +
      (q ? "+" : "") + " (" + Ubrect + OrderArea (w, h, p, _, u) +
      ", " + Uwrect + OrderCirc (w, h, p, _, u) +
      ", " + Uqbs + OrderDiag (w, h, p, _, u) +
      ", " + ssquareness + " " + RatOrderName (h, w, p, _, u) + ")";
}
// Compute symbolic name for a number or range of gliders
function GlsName (g, known, tbd) {
    if (g === KNOWN) {			// Synthesis exists but not yet attempted
	return known;
    } else if (g === TBD) {		// Synthesis not yet attempted
	return tbd;
    } else if (g === UNKNOWN) {		// Unknown synthesis
	return "x";
    } else if (g > UNKNOWN) {		// Partial synthesis
	return "x+" + (g - UNKNOWN);
    } else {				// Specific number of gliders
	return "" + g;
    }
}
// Set rule, and display its associated fields
function SetRule (r) {
    selectr = r;
    var i = rulepage[r];
    SetText ("gorule", rulenames[r]);
    SetText ("txtunk", rulenames[r]);
    SetHref ("gorule", i + ".htm");
    ShowI ("gorule", i !== "");
    ShowI ("txtunk", i === "");
}
// Created a hyphenated section-subsection name
function Dash (a, b) {
    return a.length ? b.length ? a + "-" + b : a : b;
}
// Get directory number (or NaN if non-numeric)
function GetDirn (sub, vet) {
    var n = parseInt (sub);		// Subection number (usually population)
    if (vet && sub !== ""+n) {		// Treat semi-numeric subsection as non-numeric
	n = NaN;
    }
    return n;
}
// Convert wiki page name to human-readable page name
function WikiPage (s) {
    var n = s.indexOf ("#");
    return SmartQuote ((n < 0 ? s : s.substring (n+1)).replace (/_/g, " "));
}
// Convert a filename into a local path name (URLs are unchanged)
function LocalFile (r, dir, file) {
    return file.length > 0 && file.indexOf ("/") < 0 ?
      (r !== R_B3S23 ? rulepage[r] : dir) + "/" + file + (file.indexOf (".") < 0 ? ".rle" : "") : file;
}
// Break an extremely long text line into smaller pieces, so browser will wrap it
function Wrap (s, n) {
    for (var z = "", i; (i = s.length) > n; s = s.substring (n)) {
	z += s.substring (0, n) + " ";
    }
    return z + s;
}
// Display search results to HTML user interface
function Display (r, p) {
    var cid = p.p_cid === undefined ? O_ANY : p.p_cid;	// Category number
    var cat = sUnknown;				// Category name
    var sec = "";				// Section name
    var sub = "";				// Subsection name
    var page = floor (p.p_page) - 1;		// Page number+1 for huge lists
    var gpage = Lowpart (p.p_page) - 1;		// Glider page number+1
    var file2 = "";				// Alternative file name
    var file = p.p_file;			// File name
    var per = "";				// Period URL
    var name = SmartQuote (p.p_GetNames ());	// Pattern description(s)
    var rmod = max (1, p.p_GetRmod ());		// Population/modulus
    var own = false;				// Sub-category has own page
    var h = null;				// Header structure
    var u = p.p_U () ? sN_A : sUnknown;		// What unknown means
    if (p.p_hid >= 0) {				// Known library object
	h = rulelib[r][p.p_hid];
	sec = h.h_sec;				// Section
	sub = h.h_sub;				// Subsection
	cat = h.h_cat;				// Category
	if ((i = ownsec.indexOf (sec)) >= 0) {	// Subsections that have their own pages
	    own = ownlo[i] <= p.p_minp && p.p_minp <= ownhi[i];
	}
    } else if (cid === O_CONS) {		// Stamp page
	cat = "Stamp page";
    } else if (cid !== O_ANY) {			// Unknown search object of known class (apg)
	sec = catlist[cid];
	cat = catnames[cid];
	cat = cat.substring (0, 1).toUpperCase () + cat.substring (1);
    }
    selectb = p;			// Remember current selection
    SetRule (r);
    View (Z_RESULT);			// View results
    var html = sec;			// HTML file (usually = section )
//? var n = GetDirn (sub, true);	// Section number (numeric)
    var ownSect = Dash (sec, sub);	// "own" section
    var ownPage = page;			// Page number on "own" page
    var goapg = p.p_GetApg (r).length !== 0;	// apg search supported?
    var gosof = p.p_GetSof (r).length !== 0;	// SOF name supported?
    var golis = p.p_GetLis (r).length !== 0;	// LIS name supported?
    var gohrd = p.p_GetHrd (r).length !== 0;	// HRD supported?
    if (IsArray (file)) {		// Multiple files
	file2 = file[1];
	file = file[0];
	var dir = p.p_GetDir (file);	// Pattern directory
	var adir = p.p_GetDir (file2);	// Alternate pattern directory
    } else {				// Single file
	adir = dir = p.p_GetDir (file);
    }
    var gls = GlsName (p.p_gls, sKnown, sTBD);	// Gliders (string)
    var gQual = "" + p.p_gls;		// "Gliders" section qualifier
    // Determine special by-number-of-gliders quality
    if (p.p_minp === 0) {		// Treat 0vacuum simply (i.e. not >1 glider/bit)
	gQual = "";
    } else if (p.p_gls > UNKNOWN) {	// Partial synthesis
	gQual = "p";
	gls += " (" + spartial + ")";
    } else if (p.p_gls >= UNKNOWN) {	// Unknown synthesis
	gQual = "u";
	gls += " (" + sunknown + ")";
    } else if (p.p_gls >= TBD) {	// Synthesis not yet analyzed
	gQual = "";
	gls += " (" + snot_yet_analyzed_for_synthesis + ")";
    } else if (p.p_gls >= KNOWN) {	// Synthesis not yet attempted
	gQual = "";
	gls += " (" + ssynthesis_known_to_exist + ")";
    } else {
	gls += " (" + RatName (p.p_gls, p.p_minp, _, true, 0, sN_A) + "/" + sbit + ")";
	if (p.p_gls >= 100 && p.p_minp < 100) {	// 100+ gliders is expensive (but only if population is)
	    gQual = "x";
	} else if (p.p_gls > p.p_minp) {	// Synthesis requires > 1 glider/bit
	    gQual = "p.p_gls";
	} else if (p.p_gls === p.p_minp) {	// Synthesis requires 1 glider/bit
	    gQual = "e";
	} else if (p.p_gls > 7) {	// Only 2-7 gliders are listed
	    gQual = "";
	}
    }
    if (p.p_gls >= 2 && p.p_gls <= 7) {	// Always include cheap objects
    } else if (sub === "lg") {		// Never include other large objects
	gQual = "";
    } else if (p.p_gls >= UNKNOWN) {	// Include all explicit unknown objects
    } else if (sec === "p8" || sec === "p10") {	// Include P8s+P10s up to 25 bits
    } else if (p.p_minp > 21 ||		// Exclude all objects over 21 bits
      sec === "p1" && p.p_minp > 15 || sec === "pp1" && p.p_minp > 16 ||
      sec === "p2" && p.p_minp > 18 || sec === "pp2" && p.p_minp > 17) {
	gQual = "";			// Some sections have lower limits
    }
    var vels = VelName (p, sOrthogonal + " ", sDiagonal + " ", sOblique + " ");	// user-readable velocity
    var common = false;			// Is this of a common period?
    if (h && !isNaN (h.h_per)) {
	if (perpage.indexOf (p.p_per) >= 0) {	// Common periods have own pages
	    common = true;		// (wrong for pp14, pp24, pp36, pp40, pp120 (which don't occur))
	} else if (r === R_B3S23) {	// Others are all on one page (in Life)
	    html = "period";		// (wrong for uncommon periods (which don't occur))
	    sub = "";
	}
    }
    if (r === R_B3S23 && sec === "ws") {	// Wickstretchers are under puffers
	html = "puff";
    }
    if (r === R_B3S23 && sec === "ss") {	// Differentiate spaceship groups
	html = "flotilla";
	if (!isNaN (p.p_minp)) {		// ss-2..4, ss-37 etc. are flotillae
	    if (p.p_minp >= 5 && p.p_minp < LG) {	// ss-5..34 are small spaceships
		html = "ss";
	    }
	} else if (parseInt (sub[sub.length-1]) || sub === "gemini" ||
	  sub === "hbk" || sub === "cl") {
	    html = "exotic";		// ss-[<n>][o|d|k]<d>: exotic spaceships
	    gQual = "";			// All large, so never on glider pages
	}				// ss-<digit>[<letter>]: flotilla
    }
    if (ownSect.length >= 6) {			// pp1-16-10 => pp1-16-a, etc.
	ownPage = page.toString (36);
    } else if (page >= 100) {			// 2-digit page number?
	ownPage = (page + "").substring (1);	// e.g. p1-16-01
    }
    if (p.p_cid <= O_QOSC || r === R_B3S23 && p.p_cid === O_METH) {
	per = Pprefix (p);
	if (r !== R_B3S23) {
	    per = rulepage[r] + ".htm#" + Dash (rulesec[r], per + ("p" + p.p_per));
	} else if (p.p_cid === O_METH) {
	    per = url_meth + "#meth-p" + p.p_per;
	} else {
	    per += (perpage.indexOf (p.p_per) >= 0 ? "p"+p.p_per : "period") + ".htm";
	}
    }
    var type = rulepage[r];			// URL to type page
    if (r !== R_B3S23) {			// Alternate-rule sub-section
	type += ".htm#" + Dash (rulesec[r], sec);
    } else if (page >= 0) {			// Life group on separate page
	type = ownSect + ".htm#" + Dash (ownSect, ownPage);
    } else {					// Life sub-section
	type = html + ".htm#" + Dash (sec, sub);
    }
    var gtSect = "g" + Dash (gQual, sec);
    SetBg ("colgl", GlColors (p.p_gls, p.p_minp, C_BG));
    var i = p.p_GetFlags ();
    var j = "";
    if (i & I_FF) {
	j = j + ", " + sFlip_flop;
    }
    if (i & I_OO) {
	j = j + ", " + sOn_off;
    }
    if (i & I_PHX) {
	j = j + ", " + sPhoenix;
    }
    if (i & I_BB) {
	j = j + ", " + sBabbling_brook;
    }
    if (i & I_MM) {
	j = j + ", " + sMuttering_moat;
    }
    if (p.p_per > 1 && min (p.p_GetRheight (), p.p_GetRwidth ()) <= 2) {
	j = j + ", " + sRaging_river;
    }
    SetText ("txtosc", j.length ? "(" + j.substring (2) + ")" : "");
    i = p.p_GetSymm ();
    j = p.p_GetGlide ();
    SetText ("txtsymm", SymmName (symmnames[i], p, i !== Y_C1 && i !== Y_D2X) +
      (j !== Y_C1 ? (" (glide symmetry: " +  SymmName (symmnames[i], p,
      j !== Y_C1 && j !== Y_D2X || i === Y_D2X && j === Y_D2X) + ")") : ""));
    SetText ("txtname", name);
    SetText ("gofile1", file);
    SetText ("gofile2", p.p_file2 ||
      sec === "meth" ? sRun_methuselah : sView_alternate_synthesis);
    SetText ("gocfile1", "c" + file);
    SetText ("goapg", catobj = Wrap (goapg ? p.p_GetApg (r) : "", 70));
    SetText ("catobj", catobj);
    SetText ("gosof", Wrap (p.p_GetSof (r) + ".", 70));
    SetText ("golis", Wrap (p.p_GetLis (r), 70));
    SetText ("gohrd", i = p.p_GetHrd (r));
    ShowI ("addhrd", (j = (rulehrd[r][i] || "").length) > 1);
    ShowI ("viewhrdt", j);
    SetText ("viewhrdt", "" + j);
    SetText ("gobits", i = RealName (p.p_minp, _, 0, u));
    SetText ("txtpop", i);
    SetText ("txtmaxp", p.p_maxp && (!Eq (p.p_minp, p.p_avgp) || !Eq (p.p_minp, p.p_maxp)) ?
      " (" + saverage + ": " + OrderName (p.p_avgp, p.p_per, _, u) + "; maximum: " +
      OrderName (p.p_maxp, p.p_per, _, u) + "; " + smin_max + ": " +
      RatOrderName (p.p_minp, p.p_maxp, p.p_per, _, u) + ")" : "");
    SetText ("txtinf", OrderName (p.p_inf, p.p_per, _, u));
    SetText ("txtden", RatOrderName (p.p_minp, p.p_inf, p.p_per, _, u) +
      (p.p_maxp && (!Eq (p.p_minp, p.p_avgp) || !Eq (p.p_minp, p.p_maxp)) ?
      " (" + saverage + ": " + RatOrderName (p.p_avgp, p.p_inf, p.p_per, _, u) +
      "; " + smaximum + ": " + RatOrderName (p.p_maxp, p.p_inf, p.p_per, _, u) + ")" : ""));
    SetText ("txtbox", BoxName (p.p_boxw, p.p_boxh, p.p_per, u));
    SetText ("txtlbox", BoxName (p.p_lboxw, p.p_lboxh, p.p_per, u));
    SetText ("txthull", BoxName (p.p_hullw, p.p_hullh, p.p_per, u, p.p_img === HUGEPAT));
    SetText ("txtheat", OrderName (p.p_heat, p.p_per, _, u));
    SetText ("txttemp", RealName (p.p_temp, _, 0, u));
    SetText ("txtvol", RealName (p.p_vol, _, 0, sN_A) + (!Eq (p.p_vol, p.p_svol) ?
      " (" + sstrict + ": " + RealName (p.p_svol, _, 0, sN_A) + "; " +
      s_namervol + ": " + RatName (p.p_svol, p.p_vol, _, true, 0, sN_A) + ")" : ""));
    SetText ("gocat", cat);
    SetText ("txtcat", cat);
    for (i = 1; i < 10; ++i) {
	SetText ("gowiki"+i, p.p_wiki && p.p_wiki.length >= i ? WikiPage (p.p_wiki[i-1]) : "");
    }
    SetText ("goepp", sGlider + " " + (p.p_glna || ""));
    SetText ("txtper", i = "" + RealName (p.p_per, _, 0, u) +
      (rmod !== 1 ? " (mod " + RealName (p.p_per/rmod, _, 0, u) + ")" : ""));
    SetText ("goper", i);
    SetText ("txtvel", vels);
    SetText ("gogl", gls);
    SetText ("txtg", gls);
    SetText ("gorar", RealName (p.p_freq/FREQBASE, 9, 0, sN_A) +
      " (" + s_namerar + ": " + RealName (FREQBASE/p.p_freq, 9, 0, sN_A) + ")");
    SetText ("gotts", RealName (p.p_tts, _, 0, u) +
      " (" + s_nameef + ": " + RealName (p.p_GetEf (), _, 0, u) + ")");
    i = p.p_GetAct ();
    j = p.p_GetNrotors ();
    SetText ("txtrot", RealName (j, _, 0, sN_A) + " " + (j === 1 ? srotor : srotors) + ", " +
      RealName (i, _, 0, u) + " " + (i === 1 ? scell : scells) + ": " +
      BoxName (p.p_GetRwidth (), p.p_GetRheight (), p.p_per, sN_A));
    SetHref ("gocat", type);
    for (i = 1; i < 10; ++i) {
	SetHref ("gowiki"+i, p.p_wiki && p.p_wiki.length >= i ?
	  url_wiki + encodeURIComponent (p.p_wiki[i-1]) : "");
    }
    SetHref ("gobits", "bits-" + sub + ".htm#" + Dash (sec, sub));
    SetHref ("gogl", gpage < 0 ? "glider-" + gQual + ".htm#" + gtSect : 
      gtSect + ".htm#" + gtSect + 
      (gtSect.length > 3 ? (gpage+10).toString (36) : "-" + gpage));
    SetHref ("gorar", url_common + "#nat-" + sec);
    SetHref ("gofile1", LocalFile (r, dir, file));
    SetHref ("gofile2", LocalFile (r, adir, file2));
    SetHref ("gocol", url_color + "#c-" + sec);
    SetHref ("gocfile1", LocalFile (r, dir, "c" + file));
    SetHref ("goapg", goapg ? p.p_GetGol (r) : "");
    SetHref ("sofcat", gosof ? p.p_GetSofCat () : "");
    SetHref ("gosof", gosof ? p.p_GetPent (r) : "");
    SetHref ("goepp", url_epp + ApgEpp (rulerle[r]) + "/g" + (p.p_glnr || "") + ".html");
    var viewdiff = p.p_minp >= 14 && p.p_diff !== undefined;
    if (viewdiff) {
	SetHref ("godiff", "p1-"+p.p_minp+".htm#p1-"+p.p_minp+"-"+
	  (max (0, floor (p.p_diff/100-1))+10).toString (36));
	// 17s-18s start at 100; 14s-16s start at 1, but have only 1 page
    }
    j = RealAnd (p.p_nbr, BMINUS-1);
    SetText ("txtnbrp", "" + (i = Mask2Count (p.p_nbr)));
    SetText ("txtnbr", (1<<i) + " " + (i === 0 ? srule + ": " + Mask2Nbr (j, 0) :
      srules + ": " + Mask2Nbr (j, 0) + " " + (i === 1 ? "&" : Uhellip) + " " +
      Mask2Nbr (BMINUS-1 - floor (p.p_nbr/BMINUS), 0)));
    ShowB ("viewprop", true);
    ShowR ("viewname", name.length !== 0);
    ShowR ("viewlbox", !isNaN (OrderNum (p.p_lboxw)));
    ShowR ("viewhull", !isNaN (OrderNum (p.p_hullw)));
    ShowR ("viewsymm", p.p_GetSymm () !== Y_ANY);
    ShowR ("viewcat", cat !== sUnknown);
    ShowR ("viewinf", i = h || cid === O_STILL);
    ShowR ("viewden", i);
    ShowR ("viewrar", h && p.p_freq);
    ShowR ("viewgls", h && !isNaN (p.p_gls));
    ShowR ("viewheat", h && !isNaN (OrderNum (p.p_heat)) && (i = p.p_per > 1 || p.p_velx > 0));
    ShowR ("viewper", p.p_per > 0 || cid !== O_ANY);
    ShowR ("viewnbr", h && (r < R_LEAP || r === R_TOTAL) && !isNaN (p.p_nbr));
    ShowR ("viewrot", p.p_per > 1 && !p.p_velx && p.p_hullw < OMEGA && p.p_GetAct ());
    ShowR ("viewtemp", h && !isNaN (p.p_temp) && i);
    ShowR ("viewtts", h && !Eq (p.p_tts, 0));
    ShowR ("viewvel", h && !Eq (p.p_velx, 0));
    ShowR ("viewvol", h && !isNaN (p.p_vol) && i);
    ShowR ("viewfile", file !== "");
    ShowR ("viewcol", p.p_color);
    ShowR ("viewapg", goapg);
    ShowR ("viewsof", gosof);
    ShowR ("viewlis", golis);
    ShowR ("viewhrd", gohrd);
    ShowR ("viewepp", p.p_glnr);
    ShowR ("viewwiki", p.p_wiki);
    ShowI ("gobits", i = r === h && R_B3S23 && p.p_minp > 0 && !own &&
      (p.p_minp < LG || (1<<p.p_cid) & OM_LG || p.p_cid === O_OSC && common));
    ShowI ("txtpop", !i);
    ShowI ("goper", per !== "");
    ShowI ("txtper", per === "");
    ShowI ("gocat", h);
    ShowI ("txtcat", !h);
    i = (p.p_GetFlags () & I_Q) !== 0;
    ShowI ("catqp1", i && !p.p_velx && p.p_per===1);
    ShowI ("catqosc", i && !p.p_velx && p.p_per!==1);
    ShowI ("catqss", i && p.p_velx);
    ShowI ("gogl", i = r === R_B3S23 && gQual !== "");
    ShowI ("txtg", !i);
    ShowI ("txtdiff", viewdiff);
    ShowI ("txtfile1", i = file2 !== "");
    ShowI ("gofile2", i);
    for (i = 1; i < 10; ++i) {
	ShowI ("gowiki"+i, p.p_wiki && p.p_wiki.length >= i);
	ShowI ("txtwiki"+i, p.p_wiki && p.p_wiki.length > i);
    }
}
//------------------------------ Search functions ------------------------------
// Constrain search based on velocity parameters
function SrchVel (velx, vely, veld) {
    if (srch.s_vels !== M_ANY) {
	if (!MatchNum (velx, veld,
	  srch.s_vels, srch.s_velx, srch.s_vely, srch.s_veld, 0)) {
	    return false;
	}
	if (velx) {			// Direction irrelevant if stationary
	    if (! (srch.s_velo & (vely ? vely < velx ? D_OBLIQUE : D_DIAG : D_ORTHO))) {
		return false;
	    }
	}
    }
    if (srch.s_slps !== M_ANY) {
	if (!MatchNum (velx ? vely/velx : NaN, 1,
	  srch.s_slps, srch.s_slpx, srch.s_slpy, 1, 0)) {
	    return false;
	}
    }
    return true;
}
// Filter entire sections of simple Life objects
// (i.e. still-lifes, pseudo-still-lifes, oscillators, pseudo-oscillators),
// based on period, population, velocity constraints
// If a apg search name is given, its period and/or population is also checked.
// Furthermore, still-lifes and pseudo-still-lifes are filtered based on
// heat=temperature=volatility=strict volatility=0,
// modulus=period/modulus=relative_volatility=1;
// This is only done for these categories, and only in Life, as these are the
// the easiest to check for, and these account for around 93% of the database.
function MatchHead (h) {
    if (h.h_per) {
	if (srch.s_pers !== M_ANY && !MatchNum (h.h_per, 1,
	  srch.s_pers, srch.s_perx, srch.s_pery, 1, 0) ||
	  srch.s_apgper >= 0 && h.h_per !== srch.s_apgper) {
	    return false;			// Filter by period
	}
	if (h.h_minp >= 0) {
	    if (srch.s_minps !== M_ANY && !MatchNum (h.h_minp, 1,
	      srch.s_minps, srch.s_minpx, srch.s_minpy, 1, 0) ||
		srch.s_apgminp >= 0 && h.h_minp !== srch.s_apgminp) {
		return false;			// Filter by minimum population
	    }
	}
	if (h.h_per === 1) {			// Still-lifes are totally still
	    if (h.h_minp >= 0) {
		if (srch.s_avgps !== M_ANY && !MatchNum (h.h_minp, 1,
		  srch.s_avgps, srch.s_avgpx, srch.s_avgpy, 1, 0)) {
		    return false;		// Filter by average population
		}
		if (srch.s_maxps !== M_ANY && !MatchNum (h.h_minp, 1,
		  srch.s_maxps, srch.s_maxpx, srch.s_maxpy, 1, 0)) {
		    return false;		// Filter by maximum population
		}
		if (srch.s_field && (h.h_minp < srch.s_iminp || srch.s_imaxp < h.h_minp)) {
		    return false;		// Filter by implicit image constraints
		}
	    }
	    if (srch.s_rpops !== M_ANY && !MatchNum (1, 1,
	      srch.s_rpops, srch.s_rpopx, srch.s_rpopy, 1, 0)) {
		return false;			// Filter by min/max population ratio
	    }
	    if (srch.s_glides !== Y_ANY && !MatchGlide (0, srch.s_glides)) {
		return false;			// Filter by glide symmetry
	    }
	    if (! (1 & srch.s_rmods)) {
		return false;			// Filter by period/modulus
	    }
	    if (srch.s_mods !== M_ANY && !MatchNum (1, 1,
	      srch.s_mods, srch.s_modx, srch.s_mody, 1, 0)) {
		return false;			// Filter by modulus
	    }
	    if (srch.s_heats !== M_ANY && !MatchNum (0, 1,
	      srch.s_heats, srch.s_heatx, srch.s_heaty, 1, 0)) {
		return false;			// Filter by heat
	    }
	    if (srch.s_temps !== M_ANY && !MatchNum (0, 1,
	      srch.s_temps, srch.s_tempx, srch.s_tempy, 1, 0)) {
		return false;			// Filter by temperature
	    }
	    if (srch.s_vols !== M_ANY && !MatchNum (0, 1,
	      srch.s_vols, srch.s_volx, srch.s_voly, 1, 0)) {
		return false;			// Filter by volatility
	    }
	    if (srch.s_svols !== M_ANY && !MatchNum (0, 1,
	      srch.s_svols, srch.s_svolx, srch.s_svoly, 1, 0)) {
		return false;			// Filter by strict volatility
	    }
	    if (srch.s_rvols !== M_ANY && !MatchNum (0, 1,
	      srch.s_rvols, srch.s_rvolx, srch.s_rvoly, 1, 0)) {
		return false;			// Filter by relative volatility
	    }
	    if (srch.s_img && srch.s_still === 0) {	// Filter out non-still images
		return false;
	    }
	} else {				// Oscillators are not still
	    if (srch.s_still === 1) {		// Filter out still images
		return false;
	    }
	}
	return SrchVel (0, 0, 1);		// These objects never move
    }
    return true;
}
// Match pattern with wildcard archetype in one position
function MatchWild0 (p, x, y, f, w, h, ox, oy, dxx, dxy, dyx, dyy) {
    for (var j = -h-1; j <= h+y; ++j) {
	for (var i = -w-1; i <= w+x; ++i) {
	    var c = f.f_GetCell (ox + i*dxx + j*dxy, oy + i*dyx + j*dyy);
	    var k = i < 0 || i >= x || j < 0 || j >= y ? 0 : p[j*x+i];
	    if (c >= 0 && c !== k) {
		return false;
	    }
	}
    }
    return true;
}
// Match pattern with wildcard archetype in all positions
function MatchWild1 (p, x, y, f, w, h, ox, oy, dxx, dxy, dyx, dyy) {
    if (w < 0 || h < 0) {
	return false;
    }
    for (var j = -h; j <= h; ++j) {
	for (var i = -w; i <= w; ++i) {
	    if (MatchWild0 (p, x, y, f, w, h,
	      ox+i*dxx+j*dxy, oy+i*dyx+j*dyy, dxx, dxy, dyx, dyy)) {
		return true;
	    }
	}
    }
    return false;
}
// Match pattern with wildcard archetype in all orientations and positions
function MatchWild2 (x, f, minp) {
    var l = f.f_lft;
    var r = f.f_rgt;
    var t = f.f_top;
    var b = f.f_btm;
    var w = r-l;
    var h = b-t;
    var p = Lib2Bin (x, minp, w, h, 2);
    if (!p) {		// Ignore, if pattern exceeds archetype dimensions
	return false;
    }
    var d = f.f_wid;
    var x = p.f_wid;
    var y = p.f_hgt;
    p = p.f_img;
    return  MatchWild1 (p, x, y, f, w, h, l, t, 1, 0, 0, 1) ||
	    MatchWild1 (p, x, y, f, w, h, r-1, t, -1, 0, 0, 1) ||
	    MatchWild1 (p, x, y, f, w, h, l, b-1, 1, 0, 0, -1) ||
	    MatchWild1 (p, x, y, f, w, h, r-1, b-1, -1, 0, 0, -1) ||
	    MatchWild1 (p, x, y, f, w, h, l, t, 0, 1, 1, 0) ||
	    MatchWild1 (p, x, y, f, w, h, r-1, t, 0, -1, 1, 0) ||
	    MatchWild1 (p, x, y, f, w, h, l, b-1, 0, 1, -1, 0) ||
	    MatchWild1 (p, x, y, f, w, h, r-1, b-1, 0, -1, -1, 0);
}
// See if an image matches any of several rotations
function MatchImg (x, y, f, wild, minp) {
    if (IsArray (x)) {			// match (list, string or list)
	for (var i = x.length; --i >= 0; ) {
	    if (MatchImg (y, x[i], f, -wild, minp)) {
		return true;
	    }
	}
    } else if (wild) {				// match (pattern, template)
	return MatchWild2 (wild > 0 ? x : y, f, minp);
    } else if (IsArray (y)) {			// match (string, list)
	return MatchImg (y, x, f, -wild, minp);
    } else {					// match (string, string)
	return x === y;
    }
    return false;
}
// Calculate a&b for two real numbers that may exceed the size of an integer
// (This is used with nbrs)
function RealAnd (a, b) {
    return (a%BMINUS & b%BMINUS) +
      (floor (a/BMINUS)%BMINUS & floor (b/BMINUS)%BMINUS) * BMINUS +
      (floor (a/BUNUSED) & floor (b/BUNUSED)) * BUNUSED;
}
// Calculate a|b for two real numbers that may exceed the size of an integer
// (This is used with nbrs)
function RealOr (a, b) {
    return (a%BMINUS | b%BMINUS) +
      (floor (a/BMINUS)%BMINUS | floor (b/BMINUS)%BMINUS) * BMINUS +
      (floor (a/BUNUSED) | floor (b/BUNUSED)) * BUNUSED;
}
// Calculate a^b for two real numbers that may exceed the size of an integer
// (This is used with nbrs)
function RealXor (a, b) {
    return (a%BMINUS ^ b%BMINUS) +
      (floor (a/BMINUS)%BMINUS ^ floor (b/BMINUS)%BMINUS) * BMINUS +
      (floor (a/BUNUSED) ^ floor (b/BUNUSED)) * BUNUSED;
}
// Match glide symmetry
// In some cases, one kind of glide symmetry is equivalent to another:
// - Y_C1 allows Y_D2P, Y_D2X, Y_C2, Y_C4 glide symmetries
// - Y_C2 allows Y_D2P, Y_D2X, Y_C4 glide symmetries
// - Y_D2P allows Y_D2P glide symmetry, and treats Y_C2 as Y_D2P (e.g. Life Tumbler)
// - Y_D2X allows Y_D2X glide symmetry, and treats Y_C2 as Y_D2X
// - Y_C4 allows Y_D2P glide symmetry, and treats Y_D2X as Y_D2P
// - Y_D4X allows Y_D2P glide symmetry, and treat Y_C4 as Y_D2P (e.g. 3/4-Life Figure-8)
// - Y_D4P allows Y_D2X glide symmetry, and treats Y_C4 as Y_D2X
// (NOTE: At present, objects with a specific symmetry are not considered
//  to implicitly have the same kind of glide symmetry; e.g. a beacon)
function MatchGlide (s, m) {
    var b = symmbits[m];			// Mask of bits to try
    var g = floor (s / 10 % 10);		// Glide symmetry
    s %= 10;					// Base symmetry
    return m === Y_ANY || b & (1 << g) ||	// Exact match
      b & (1 << Y_D2X) && g === Y_D2P && s === Y_C4 ||
      b & (1 << Y_C2) && g === s && (s === Y_D2P || s === Y_D2X) ||
      b & (1 << Y_C4) && (g === Y_D2P && s === Y_D4X || g === Y_D2P && s === Y_D4P);
}
// Lookup the current pattern in the library for the selected rule(s)
function Lookup () {
    nfound = pagesize = 0;
    var i;
    var k;
    var ntotal = 0;				// Total items
    var nitems = 0;				// Items searched
    for (var pass = 0; pass < 2; ++pass) {	// First pass counts, second searches
	if (pass) {
	    SetMax ("progsearch", ntotal);
	    SetValue ("progsearch", nitems);
	    ShowI ("progsearch", true);
	}
	for (var r = R_B3S23; r < R_MAX; ++r) {	// Search all relevant rules
	    results[r] = [];
	    nresults[r] = 0;
	    if (srch.s_rules !== R_ANY && r !== srch.s_rules) {	// Filter by rule
		continue;
	    }
	    for (var j = 0; j < rulelib[r].length; ++j) {
		var h = rulelib[r][j];		// Examine every section in library
		if (h.h_exp && !srch.s_exp) {	// Use expanded sources?
		    continue;
		}
		var q = h.h_cid === O_CONS && srch.s_cats & OM_QUASIS && !(srch.s_cats & OM_CONS);	// Sub-filter quasi-objects?
		for (i = 0; i < O_ANY; ++i) {	// Filter by category
		    if (srch.s_cats & (1 << i) && (h.h_cid === i ||
		      h.h_sec === catlist[i] || h.h_sub === catlist[i])) {
			break;
		    }
		}
		if (i >= O_ANY && !q) {
		    continue;
		}
		if (srch.s_whdr !== W_ANY) {
		    k = WildCmp (h.h_name, srch.s_phdr, false);		// Search by header name
		    if (k === ((srch.s_whdr & W_NOT) !== 0)) {
			continue;
		    }
		}
		if (r === R_B3S23 && h.h_per && !MatchHead (h)) {	// Quickly filter Life stills/pseudo-stills
		    continue;						// and oscillators/pseudo-oscillators
		}
		var o = h.h_obj;		// Object list in this category
		if (srch.s_pop && r === R_B3S23 && srch.s_wpat === W_IS &&
		  h.h_minp >= 15) {		// Quick-search for specific still-life
		    if (h.h_per !== 1 || h.h_minp !== srch.s_pop || h.h_pseudo) {
			continue;
		    }
		    if (pass && srch.s_idx <= o.o_length) {	// Try direct look-up
			p = o[srch.s_idx-1];
			if (WildCmp (p.p_name, srch.s_ppat, true)) {
			    results[r][nresults[r]++] = p;	// Add solution
			    ++nfound;
			    nitems += o.o_length;
			    continue;
			}
		    }
		}
		if (!pass) {				// First pass: just count searchable items
		    ntotal += o.length;
		    continue;
		}
		for (i = 0; i < o.length; ++i, ++nitems) {
		    if (! (nitems % floor (ntotal/100))) {	// Periodically update search status
			SetText ("txtstatus", sSearching + Uhellip + " " +
			  min (100, round (nitems*100/ntotal)) +
			  "% " + sdone + ".");
			SetValue ("progsearch", nitems);
		    }
		    var p = o[i];			// Examine every line in library:
		    if (q && (!(p.p_GetFlags () & I_Q) ||
		      !(srch.s_cats & (p.p_velx ? OM_QSS : p.p_per > 1 ? OM_QOSC : OM_QSTILL)))) {
			    continue;			// Quasi-object?
		    }
		    if (srch.s_diff && !p.p_diff) {	// Difficult still-lifes?
			continue;
		    }
		    if (srch.s_multin && !IsArray (p.p_name)) {
			continue;			// Objects with multiple names
		    }
		    if (srch.s_multif && !IsArray (p.p_file)) {
			continue;			// Objects with multiple files
		    }
		    if (srch.s_multic && !p.p_color) {
			continue;			// Objects with multi-color syntheses
		    }
		    if (srch.s_minps !== M_ANY && !MatchNum (p.p_minp, 1,
		      srch.s_minps, srch.s_minpx, srch.s_minpy, 1, 0)) {
			continue;			// Filter by minimum population
		    }
		    if (srch.s_avgps !== M_ANY && !MatchNum (OrderNum (p.p_avgp), 1,
		      srch.s_avgps, srch.s_avgpx, srch.s_avgpy, 1, 0)) {
			continue;			// Filter by average population
		    }
		    if (srch.s_maxps !== M_ANY && !MatchNum (OrderNum (p.p_maxp), 1,
		      srch.s_maxps, srch.s_maxpx, srch.s_maxpy, 1, 0)) {
			continue;			// Filter by maximum population
		    }
		    if (srch.s_rpops !== M_ANY && !MatchNum (p.p_minp, OrderNum (p.p_maxp),
		      srch.s_rpops, srch.s_rpopx, srch.s_rpopy, 1, 0)) {
			continue;			// Filter by min/max population ratio
		    }
		    if (srch.s_infs !== M_ANY && !MatchNum (OrderNum (p.p_inf), 1,
		      srch.s_infs, srch.s_infx, srch.s_infy, 1, 0)) {
			continue;			// Filter by influence
		    }
		    if (srch.s_dens !== M_ANY && !MatchNum (p.p_minp, OrderNum (p.p_inf),
		      srch.s_dens, srch.s_denx, srch.s_deny, 1, 0)) {
			continue;			// Filter by minimum density
		    }
		    if (srch.s_adens !== M_ANY && !MatchOrderNum (p.p_avgp, p.p_inf,
		      srch.s_adens, srch.s_adenx, srch.s_adeny, 1, 0)) {
			continue;			// Filter by average density
		    }
		    if (srch.s_mdens !== M_ANY && !MatchOrderNum (p.p_maxp, p.p_inf,
		      srch.s_mdens, srch.s_mdenx, srch.s_mdeny, 1, 0)) {
			continue;			// Filter by maximum density
		    }
		    if (srch.s_pers !== M_ANY && !MatchNum (p.p_per, 1,
		      srch.s_pers, srch.s_perx, srch.s_pery, 1, 0)) {
			continue;			// Filter by period
		    }
		    if (srch.s_glss !== M_ANY && !MatchNum (p.p_gls, 1,
		      srch.s_glss, srch.s_glsx, srch.s_glsy, 1, TBD)) {
			continue;			// Filter by gliders
		    }
		    if (srch.s_rglss !== M_ANY) {
			if (p.p_gls >= KNOWN || !MatchNum (p.p_gls, p.p_gls >= KNOWN ? 1 : p.p_minp,
			  srch.s_rglss, srch.s_rglsx, srch.s_rglsy, 1, 0)) {
			    continue;			// Filter by relative gliders
			}
		    }
		    if (srch.s_glnas !== M_ANY && !MatchNum (p.p_glna || 0, 1,
		      srch.s_glnas, srch.s_glnax, srch.s_glnay, 1, 0)) {
			continue;			// Filter by human-readable glider number
		    }
		    if (srch.s_glnrs !== M_ANY && !MatchNum (p.p_glnr || 0, 1,
		      srch.s_glnrs, srch.s_glnrx, srch.s_glnry, 1, 0)) {
			continue;			// Filter by raw glider number
		    }
		    if (!SrchVel (p.p_velx, p.p_vely, p.p_veld)) {
			continue;			// Filter by velocity;
		    }
		    k = p.p_GetFlags ();
		    if (k & I_PHX) {			// Filter phoenix
			if (! (srch.s_phxs & P_PHX)) {
			    continue;
			}
		    } else {				// Filter other
			if (! (srch.s_phxs & P_NPHX)) {
			    continue;
			}
		    }
		    if (k & I_FF) {			// Filter flip-flop
			if (! (srch.s_ffs & H_FF)) {
			    continue;
			}
		    } else if (k & I_OO) {		// Filter on-off
			if (! (srch.s_ffs & H_OO)) {
			    continue;
			}
		    } else {				// Filter other
			if (! (srch.s_ffs & H_NEITHER)) {
			    continue;
			}
		    }
		    if (k & I_BB) {			// Filter babbling brook
			if (! (srch.s_rots & B_BB)) {
			    continue;
			}
		    } else if (k & I_MM) {		// Filter muttering moat
			if (! (srch.s_rots & B_MM)) {
			    continue;
			}
		    } else {				// Filter other
			if (! (srch.s_rots & B_NEITHER)) {
			    continue;
			}
		    }
		    if (p.p_per > 1 && p.p_GetRaging ()) {
			if (! (srch.s_rivers & J_RR)) {	// Filter raging river
			    continue;
			}
		    } else {				// Filter non-raging river
			if (! (srch.s_rivers & J_NRR)) {
			    continue;
			}
		    }
		    if (srch.s_symms !== Y_ANY) {
			if (! ((1 << p.p_GetSymm ()) & symmbits[srch.s_symms])) {
			    continue;			// Filter by symmetry
			}
		    }
		    if (srch.s_glides !== Y_ANY &&
		      !MatchGlide (p.p_symm, srch.s_glides)) {
			continue;			// Filter by glide symmetry
		    }
		    if (srch.s_pars !== 7 &&
		      ! (p.p_GetPar (0, 7) & srch.s_pars)) {	// Filter by parity
			continue;
		    }
		    var rmod = p.p_GetRmod ();		// Population / modulus
		    if (! (rmod & srch.s_rmods)) {
			continue;			// Filter by population / modulus
		    }
		    if (srch.s_mods !== M_ANY && !MatchNum (p.p_per, rmod,
		      srch.s_mods, srch.s_modx, srch.s_mody, 1, 0)) {
			continue;			// Filter by modulus
		    }
		    if (srch.s_boxws !== M_ANY && !MatchNum (p.p_boxw, 1,
		      srch.s_mods, srch.s_boxwx, srch.s_boxwy, 1, 0)) {
			continue;			// Filter by smallest box width
		    }
		    if (srch.s_boxhs !== M_ANY && !MatchNum (p.p_boxh, 1,
		      srch.s_mods, srch.s_boxhx, srch.s_boxhy, 1, 0)) {
			continue;			// Filter by smallest box height
		    }
		    if (srch.s_boxds !== M_ANY && !MatchNum (hypot (p.p_boxw, p.p_boxh), 1,
		      srch.s_mods, srch.s_boxdx, srch.s_boxdy, 1, 0)) {
			continue;			// Filter by smallest box diagonal
		    }
		    if (srch.s_boxcs !== M_ANY && !MatchNum (2 * (p.p_boxw + p.p_boxh), 1,
		      srch.s_mods, srch.s_boxcx, srch.s_boxcy, 1, 0)) {
			continue;			// Filter by smallest box circumference
		    }
		    if (srch.s_boxas !== M_ANY && !MatchNum (Mul (p.p_boxw, p.p_boxh), 1,
		      srch.s_mods, srch.s_boxax, srch.s_boxay, 1, 0)) {
			continue;			// Filter by smallest box area
		    }
		    if (srch.s_boxss !== M_ANY && !MatchNum (p.p_boxh, p.p_boxw,
		      srch.s_boxss, srch.s_boxsx, srch.s_boxsy, 1, 0)) {
			continue;			// Filter by smallest bounding box squareness
		    }
		    if (srch.s_lboxws !== M_ANY && !MatchNum (OrderNum (p.p_lboxw), 1,
			srch.s_lboxws, srch.s_lboxwx, srch.s_lboxwy, 1, 0)) {
			continue;			// Filter by largest bounding box width
		    }
		    if (srch.s_lboxhs !== M_ANY && !MatchNum (OrderNum (p.p_lboxh), 1,
			srch.s_lboxhs, srch.s_lboxhx, srch.s_lboxhy, 1, 0)) {
			continue;			// Filter by largest bounding box height
		    }
		    if (srch.s_lboxds !== M_ANY && !MatchNum (hypot (OrderNum (p.p_lboxw), OrderNum (p.p_lboxh)), 1,
			srch.s_lboxds, srch.s_lboxdx, srch.s_lboxdy, 1, 0)) {
			continue;			// Filter by largest bounding box diagonal
		    }
		    if (srch.s_lboxcs !== M_ANY && !MatchNum (2 * Mul (OrderNum (p.p_lboxw) + OrderNum (p.p_lboxh)), 1,
			srch.s_lboxcs, srch.s_lboxcx, srch.s_lboxcy, 1, 0)) {
			continue;			// Filter by largest bounding box circumference
		    }
		    if (srch.s_lboxas !== M_ANY && !MatchNum (Mul (OrderNum (p.p_lboxw) * OrderNum (p.p_lboxh)), 1,
			srch.s_lboxas, srch.s_lboxax, srch.s_lboxay, 1, 0)) {
			continue;			// Filter by largest bounding box area
		    }
		    if (srch.s_lboxss !== M_ANY && !MatchOrderNum (p.p_lboxh, p.p_lboxw,
			srch.s_lboxss, srch.s_lboxsx, srch.s_lboxsy, 1, 0)) {
			continue;			// Filter by largest bounding box squareness
		    }
		    if (srch.s_hullws !== M_ANY && !MatchNum (OrderNum (p.p_hullw), 1,
			srch.s_hullws, srch.s_hullwx, srch.s_hullwy, 1, 0)) {
			continue;			// Filter by hull width
		    }
		    if (srch.s_hullhs !== M_ANY && !MatchNum (OrderNum (p.p_hullh), 1,
			srch.s_hullhs, srch.s_hullhx, srch.s_hullhy, 1, 0)) {
			continue;			// Filter by hull height
		    }
		    if (srch.s_hullds !== M_ANY && !MatchNum (hypot (OrderNum (p.p_hullw), OrderNum (p.p_hullh)), 1,
			srch.s_hullds, srch.s_hulldx, srch.s_hulldy, 1, 0)) {
			continue;			// Filter by hull diagonal
		    }
		    if (srch.s_hullcs !== M_ANY && !MatchNum (2 * Mul (OrderNum (p.p_hullw) + OrderNum (p.p_hullh)), 1,
			srch.s_hullcs, srch.s_hullcx, srch.s_hullcy, 1, 0)) {
			continue;			// Filter by hull circumference
		    }
		    if (srch.s_hullas !== M_ANY && !MatchNum (Mul (OrderNum (p.p_hullw) * OrderNum (p.p_hullh)), 1,
			srch.s_hullas, srch.s_hullax, srch.s_hullay, 1, 0)) {
			continue;			// Filter by hull area
		    }
		    if (srch.s_hullss !== M_ANY && !MatchOrderNum (p.p_hullh, p.p_hullw,
			srch.s_hullss, srch.s_hullsx, srch.s_hullsy, 1, 0)) {
			continue;			// Filter by hull squareness
		    }
		    if (srch.s_rboxws !== M_ANY && !MatchNum (p.p_GetRwidth (), 1,
		      srch.s_mods, srch.s_rboxwx, srch.s_rboxwy, 1, 0)) {
			continue;			// Filter by rotor box width
		    }
		    if (srch.s_rboxhs !== M_ANY && !MatchNum (p.p_GetRheight (), 1,
		      srch.s_mods, srch.s_rboxhx, srch.s_rboxhy, 1, 0)) {
			continue;			// Filter by rotor box height
		    }
		    if (srch.s_rboxds !== M_ANY && !MatchNum (hypot (p.p_GetRwidth (), p.p_GetRheight ()), 1,
		      srch.s_mods, srch.s_rboxdx, srch.s_rboxdy, 1, 0)) {
			continue;			// Filter by rotor box diagonal
		    }
		    if (srch.s_rboxcs !== M_ANY && !MatchNum (2 * (p.p_GetRwidth () + p.p_GetRheight ()), 1,
		      srch.s_mods, srch.s_rboxcx, srch.s_rboxcy, 1, 0)) {
			continue;			// Filter by rotor box circumference
		    }
		    if (srch.s_rboxas !== M_ANY && !MatchNum (Mul (p.p_GetRwidth (), p.p_GetRheight ()), 1,
		      srch.s_mods, srch.s_rboxax, srch.s_rboxay, 1, 0)) {
			continue;			// Filter by rotor box area
		    }
		    if (srch.s_rboxss !== M_ANY && !MatchNum (p.p_GetRheight (), p.p_GetRwidth (),
		      srch.s_rboxss, srch.s_rboxsx, srch.s_rboxsy, 1, 0)) {
			continue;			// Filter by rotor bounding box squareness
		    }
		    if (srch.s_acts !== M_ANY && !MatchNum (OrderNum (p.p_GetAct ()), 1,
		      srch.s_acts, srch.s_actx, srch.s_acty, 1, 0)) {
			continue;			// Filter by active rotor cells
		    }
		    if (srch.s_nrots !== M_ANY && !MatchNum (OrderNum (p.p_GetNrotors ()), 1,
		      srch.s_nrots, srch.s_nrotx, srch.s_nroty, 1, 0)) {
			continue;			// Filter by number of rotors
		    }
		    if (srch.s_heats !== M_ANY && !MatchNum (OrderNum (p.p_heat), 1,
		      srch.s_heats, srch.s_heatx, srch.s_heaty, 1, 0)) {
			continue;			// Filter by heat
		    }
		    if (srch.s_temps !== M_ANY && !MatchNum (p.p_temp, 1,
		      srch.s_temps, srch.s_tempx, srch.s_tempy, 1, 0)) {
			continue;			// Filter by temperature
		    }
		    if (srch.s_vols !== M_ANY && !MatchNum (p.p_vol, 1,
		      srch.s_vols, srch.s_volx, srch.s_voly, 1, 0)) {
			continue;			// Filter by volatility
		    }
		    if (srch.s_svols !== M_ANY && !MatchNum (p.p_svol, 1,
		      srch.s_svols, srch.s_svolx, srch.s_svoly, 1, 0)) {
			continue;			// Filter by strict volatility
		    }
		    if (srch.s_rvols !== M_ANY && !MatchNum (p.p_svol, p.p_vol,
		      srch.s_rvols, srch.s_rvolx, srch.s_rvoly, 1, 0)) {
			continue;			// Filter by relative volatility
		    }
		    if (srch.s_ttss !== M_ANY && !MatchNum (p.p_tts, 1,
		      srch.s_ttss, srch.s_ttsx, srch.s_ttsy, 1, 0)) {
			continue;			// Filter by time to stabilize
		    }
		    if (srch.s_efs !== M_ANY && !MatchNum (p.p_GetEf (), 1,
		      srch.s_efs, srch.s_efx, srch.s_efy, 1, 0)) {
			continue;			// Filter by evolutionary factor
		    }
		    if (srch.s_rars !== M_ANY && !MatchNum (FREQBASE, p.p_freq,
		      srch.s_rars, srch.s_rarx, srch.s_rary, 1, _)) {
			continue;			// Filter by rarity
		    }
		    if (srch.s_freqs !== M_ANY && !MatchNum (p.p_freq, FREQBASE,
		      srch.s_freqs, srch.s_freqx, srch.s_freqy, 1, _)) {
			continue;			// Filter by frequency
		    }
		    if (srch.s_nbr &&
		      RealAnd (srch.s_nbr, p.p_nbr) !== srch.s_nbr) {
			continue;			// Filter by rules
		    }
		    if (srch.s_apgpref.length && srch.s_apgpref.substring (0, 1) !== "x" &&
		      p.p_apg !== srch.s_apgpref) {	// Filter by explicit apg name
			continue;
		    }
		    if (srch.s_wpat !== W_ANY) {	// Filter by pattern name
			k = WildCmp (p.p_name, srch.s_ppat, true);
			if (k === ((srch.s_wpat & W_NOT) !== 0)) {
			    continue;
			}
		    }
		    if (srch.s_wfile !== W_ANY) {	// Filter by file name
			k = WildCmp (p.p_file, srch.s_pfile, false);
			if (k === ((srch.s_wfile & W_NOT) !== 0)) {
			    continue;
			}
		    }
		    if (srch.s_wwiki !== W_ANY) {	// Filter by LikeWiki page
			k = WildCmp (p.p_wiki || "", srch.s_pwiki, false);
			if (k === ((srch.s_wwiki & W_NOT) !== 0)) {
			    continue;
			}
		    }
		    if (srch.s_wapg !== W_ANY) {	// Filter by apg search name
			k = WildCmp (p.p_GetApg (), srch.s_papg, false);
			if (k === ((srch.s_wapg & W_NOT) !== 0)) {
			    continue;
			}
		    }
		    if (srch.s_wsof !== W_ANY) {	// Filter by SOF name
			k = WildCmp (p.p_GetSof (), srch.s_psof, false);
			if (k === ((srch.s_wsof & W_NOT) !== 0)) {
			    continue;
			}
		    }
		    if (srch.s_wlis !== W_ANY) {	// Filter by LIS name
			k = WildCmp (p.p_GetLis (), srch.s_plis, false);
			if (k === ((srch.s_wlis & W_NOT) !== 0)) {
			    continue;
			}
		    }
		    if (srch.s_whrd !== W_ANY) {	// Filter by HRD
			k = WildCmp (p.p_GetHrd (), srch.s_phrd, false);
			if (k === ((srch.s_whrd & W_NOT) !== 0)) {
			    continue;
			}
		    }
		    if (srch.s_field) {			// Image match
			// Filter by implicit image constraints
			if (h.h_cid !== O_METH &&
			  (p.p_maxp < srch.s_iminp || srch.s_imaxp < p.p_minp) ||
			  !IsArray (p.p_img) && p.p_img.charCodeAt (1) === 10) {
			    continue;
			}
			if (!MatchImg (p.p_img, srch.s_img,
			  srch.s_field, srch.s_field.f_wild < 0, p.p_minp)) {
			    continue;
			}
			if (srch.s_field.f_wild >= 0) {	// Only one image match per rule!
			    j = rulelib[r].length;	// (unless wildcards are used)
			}
		    }
		    results[r][nresults[r]++] = p;	// Add solution
		    ++nfound;
		}
	    }
	}
    }
    var therule = Sort (true, 0);		// Build result table
    if (nfound === 0) {				// No matches found:
	View (Z_NONE);				// Pattern not found!
	SetText ("txtstatus", sNotFound);
	if (selectb) {
	    Display (srch.s_rules, selectb);
	}
    } else {					// Matches found:
	View (Z_MANY);
	if (nfound > 1) {			// Multiple matches:
	    selectr = nrules === 1 ? therule : srch.s_rules;	// Show search rule
	    SetText ("gorule", rulenames[selectr]);		// (unless there is only one)
	    SetText ("txtunk", rulenames[selectr]);
	    SetHref ("gorule", (i = rulepage[selectr]) + ".htm");
	    ShowI ("gorule", i !== "");
	    ShowI ("txtunk", i === "");
	} else if (view === V_LIST) {		// Select the only line in list box
	    Found (therule, 0);
	} else {				// Select the only item in stamp page
	    SortStamp (0, 0, true);
	}
    }
}
// Draw a glider-annotation string
function DrawGls (ctx, x, y, str, sel, f, r) {
    var font = Id ("imgfont");			// Font image
    for (var i = 0; i < str.length; ++i) {
	var c = str[i];
	if ((c = fontascii.indexOf (c)) >= 0) {
	    var w = fontwidth[c];
	    DrawImage (ctx, font, 8*c, 13*((c===23?r:f)+sel), w+2, 13, x, y, w+2, 13);
	    x += w;
	}
    }
    return x;
}
// Draw a matrix of dead background cells
function SortDots (ctx, x, y, w, h, m) {
    if (m === 4) {					// Draw dead cells
	for (var j = 0; j < h; j += m) {
	    for (var i = 0; i < w; i += m) {
		DrawRect (ctx, x+i+2, y+j+2, 1, 1, C_STAMP_DEAD);
	    }
	}
    }
}
// Set up navigation buttons above (and/or below) result list table/stamp
function SortScroll (p) {
    ShowB ("viewscroll"+p, npages > 1);		// Optionally enable scroll buttons
    SetText ("inpagen"+p, "/" + npages);
    ShowI ("inpaget"+p, npages > MAXPAGES);
    ShowI ("inpages"+p, npages <= MAXPAGES);
    Enable ("inhome"+p, pageno > 0);		// Gray navigation buttons
    Enable ("inpgup"+p, pageno > 0);
    Enable ("inpgdn"+p, pageno+1 < npages);
    Enable ("inend"+p, pageno+1 < npages);
    nosort = true;
    SetValue ("inpaget"+p, (pageno+1));		// Force page number
    if (npages <= MAXPAGES) {
	var i = GetOptions ("inpages"+p).length;
	if (i > npages) {			// Delete previous excess pages
	    TruncOptions ("inpages"+p, i = npages);
	}
	for (; i < npages; ++i) {		// Create select box with all pages
	    AddOption ("inpages"+p, ""+(i+1));
	}
	SetSel ("inpages"+p, pageno);
    }
    nosort = false;
}
// Display sorted solution stamp page
// idx is one of: -1=create page; n=select item n
function SortStamp (page, idx, actually) {
    var ctx = GetContext ("canstamp", "2d");	// Stamp page image context
    var r;
    var i;
    var n;
    var p;
    var u;
    var v;
    var x;
    var y;
    if (!pagesize) {				// Compute page layout only once
	stampw = 12;				// Stamp width
	stamph = 7;				// Stamp height
	for (r = 0; r < R_MAX; ++r) {		// Find largest bounding box
	    n = nresults[r];
	    for (i = 0; i < n; ++i) {
		p = results[r][i];
		if (p.p_boxw < 160) {
		    stampw = max (stampw, p.p_boxw);
		    stamph = max (stamph, p.p_boxh);
		} else if (p.p_GetNames ().length > 7) {
		    stampw = max (stampw, 22);
		}
	    }
	}
	stampw = ceil ((stampw+3)/5) * 5;	// Pad 3, round up to multiple of 5
	stamph = ceil ((stamph+3)/5) * 5;
	stampx = max (floor (630/stampm/stampw), 1);		// Columns
	stampy = max (floor (470/stampm/stamph), 1);		// Rows
	pagesize = stampx * stampy;				// Ideal page size
	for (r = npages = 0; r < R_MAX; ++r) {			// Pages/each rule
	    npages += rulefirst[r] = ceil (nresults[r] / pagesize);
	}
    }
    stampx = max (floor (630/stampm/stampw, 1));		// Columns
    stampy = max (floor (470/stampm/stamph, 1));		// Rows
    npages = max (1, npages);					// # of pages
    pageno = page = max (0, min (page, npages-1));		// Reasonable page number
    for (r = 0; page >= rulefirst[r]; ++r) {			// Page number within rule
	page -= rulefirst[r];
    }
    var n = nresults[r] - page * pagesize;			// Remaining items
    stampn = min (n, stampx*stampy);				// Items on page
    stampx = max (1, min (n, stampx));
    stampy = max (1, min (ceil (n/stampx), stampy));
    var wid = stampx*stampw + floor (21/stampm);		// Life image limits
    var hgt = stampy*stamph + floor (21/stampm);
    stampf = new Field (wid+4, hgt+4);
    stampr = stampm*wid + 1;					// Net image width
    stampb = stampm*hgt + 1;					// Net image height
    stamprule = r;						// Rule for all items
    var o = 0;							// Order of magnitude of heat
    if (actually) {
	SetWidth ("canstamp", stampr);
	SetHeight ("canstamp", stampb);
	SortDots (ctx, 0, 0, stampr, stampb, stampm);
	SortScroll ("");			// Set up navigation buttons
	ShowB ("viewscroll2", false);		// Scroll buttons only on top
	stampq = new Pattern (0, null, "", undefined,
	  "Search results" + (npages > 1 ? " (page "+(pageno+1)+"/"+npages+")" : ""),
	  O_CONS, 0, OMEGA, OMEGA, OMEGA, 0, NaN, NaN, NaN, Y_ANY, wid, hgt, NaN, NaN,
	  NaN, NaN, 1, UNKNOWN, NaN, 0, 1, 0, 0, NaN, 0, -1);
    }
    var j = -page * pagesize;			// Item number on page
    n = nresults[r];				// Number of matches this rule
    for (i = 0; i < n; ++i, ++j) {
	if (j < 0) {				// Ignore all before this page
	    continue;
	}
	u = j%stampx * stampw;
	v = floor (j/stampx) * stamph;
	p = results[r][i];			// Object index
	if (idx === j) {			// Selecting this specific item
	    if (actually) {
		Display (r, p);
		Image (null, r, p, p.p_GetFile ());
	    } else {				// Hover over this specific item
		return SmartQuote (p.p_GetNames ()) +
		  " [" + GlsName (p.p_gls, sKnown, sTBD) + "]";
	    }
	    idx = -1;				// Never select another on same page
	} else if (!actually) {
	    continue;
	}
	var sel = p === selectb && idx < 0;	// Is object selected?
	if (sel) {
	    x = u ? 0 : 8;
	    y = v ? 0 : 4;
	    DrawRect (ctx, u*stampm+8-x, v*stampm+4-y,
	      ((j+1)%stampx ? stampw*stampm : stampr)+x,
	      (j/stampx+1 < stampy ? stamph*stampm : stampb)+y, C_STAMP_SEL);
	    SortDots (ctx, u*stampm+8-x, v*stampm+4-y,
	      ((j+1)%stampx ? stampw*stampm : stampr)+x,
	      (j/stampx+1 < stampy ? stamph*stampm : stampb)+y, stampm);
	}
	if (p.p_boxw < 160) {			// Draw small objects
	    Convert (null, ctx, stampf, r, p, ~stampm,
	      SCRWIDTH, SCRWIDTH, u+20/stampm+2, v+20/stampm+2, 0, "",
	      sel ? C_STAMP_SEL : C_BG, C_bg);
	} else {				// Text large objects
	    ctx.font = sFont;
	    ctx.textBaseline = "top";
	    var str = SmartQuote (p.p_GetNames ());	// Displayed name
	    var tw = ctx.measureText (str).width;	// Name's width
	    DrawRect (ctx, u*stampm+20, v*stampm+18, tw+4, 16,
	      sel ? C_STAMP_SEL : C_BG);	// Clear background
	    ctx.fillStyle = C_TEXT_NORMAL;
	    ctx.fillText (str, u*stampm+21, v*stampm+18);
	}
	var col = F_DIGIT;			// Glider annotation color: teal by default
	var xcol = F_DIGIT;			// Annotation color for X: red by default
	if (p.p_gls > UNKNOWN+p.p_minp) {	// Expensive partial: red X (+optional yellow digits)
	    col = F_GT;
	} else if (p.p_gls === UNKNOWN+p.p_minp) {	// Sort of expensive partial: red X (+optional green digits)
	    col = F_EQ;
	} else if (p.p_gls >= UNKNOWN) {	// Unknown/partial: red X (+optional teal digits)
	} else if (p.p_gls >= TBD) {		// TBD: grey X
	    xcol = col = F_NOTE;
	} else if (p.p_gls >= KNOWN) {		// Known: green X
	    xcol = col = F_EQ;
	} else if (p.p_gls > p.p_minp) {	// >1 glider/bit: yellow
	    col = F_GT;
	} else if (p.p_gls === p.p_minp) {	// 1 glide/bit: green
	    col = F_EQ;
	}
	x = DrawGls (ctx, u*stampm+8, v*stampm+4,
	  GlsName (p.p_gls, "x", "x"), sel * F_SEL, col, xcol);
	if (p.p_freq > 0 && (srch.s_rars !== M_ANY || srch.s_freqs !== M_ANY ||
	  defsort1 === S_FREQ || defsort1 === S_RAR ||
	  defsort2 === S_FREQ || defsort2 === S_RAR)) {
	    DrawGls (ctx, x+4, v*stampm+4, RealName (FREQBASE/p.p_freq, 5, 0, sN_A),
	      sel * F_SEL, F_NOTE);
	} else if (p.p_tts) {			// Methuselahs: time to stabilize
	    DrawGls (ctx, x+4, v*stampm+4, RealName (p.p_tts, 5, 0, u),
	      sel * F_SEL, F_NOTE);
	}
	stampq.p_minp += p.p_minp;		// Accumulate aggregate statistics
	stampq.p_temp += p.p_temp * p.p_minp;
	stampq.p_svol += p.p_svol * p.p_minp;
	stampq.p_per = LCM (stampq.p_per, p.p_per, CT);
	stampq.p_tts = max (stampq.p_tts, p.p_tts);
	x = OrderPair (p.p_heat, p.p_per);
	if (o < x[1]) {				// Hotter by orders of magnitude?
	    o = x[1];
	    stampq.p_heat = 0;
	}
	if (o === x[1]) {
	    stampq.p_heat += p.p_heat / p.p_per;
	}
	if (!j) {				// First item: use its velocity
	    stampq.p_velx = p.p_velx;
	    stampq.p_vely = p.p_vely;
	    stampq.p_veld = p.p_veld;
	} else if (stampq.p_velx !== p.p_velx || stampq.p_vely !== p.p_vely ||
	  stampq.p_veld !== p.p_veld) {		// Subsequent items: velocities must match
	    stampq.p_velx = stampq.p_vely = 0;
	    stampq.p_veld = 1;
	}
	if (j+1 >= stampx*stampy) {		// Stop after one page
	    ++j;
	    break;
	}
    }
    Compact (stampf);
    if (actually) {
	if (stampq.p_minp) {			// Finalize weighted statistics
	    stampq.p_temp /= stampq.p_minp;
	    stampq.p_vol /= stampq.p_minp;
	    stampq.p_svol /= stampq.p_minp;
	}
	stampq.p_heat = CacheOrder (stampq.p_heat*stampq.p_per, o);
	TruncTable ("tablist", 0);		// No need for list table anymore
    } else {
	return "";
    }
}
// Draw column heading bar for sort list table
function SortHdr (tab, j) {
    var tr = AddRow (tab, j, listhdr, 0, 0, true, 1, C_BG);
    for (var i = j = 0; i < S_MAX; ++i) {	// Color column headings
	if (viscol[i]) {
	    SetBg (GetCells (tr)[j++], i === defsort1 ?
	      (sortdir1 < 0 ? C_COL_BACK : C_COL_SORT) : C_COL_NORMAL);
	}
    }
}
// Display sorted solution list
// NOTE: No columns for: diff exp ff river rot phx rule pars multic multif multin wiki
function SortList (page) {
    var v = (srch.s_cats & OM_VELS) !== 0;			// Velocity allowed?
    var o = (srch.s_cats & OM_PERS) !== 0;			// Period allowed?
    var m = (srch.s_cats & OM_METH) !== 0;			// Methuselah allowed?
    var s = (srch.s_cats & OM_SS) !== 0;			// Spaceship?
    var r = (srch.s_cats & OM_RARS) !== 0;			// Is rarity applicable?
    var q = o && (srch.s_cats & OM_OSCS) !== 0;			// Has rotor?
    var i, j, r, n;
    viscol[S_MINP] = IsVis ("minp", o) || defsort1 === S_MINP || defsort2 === S_MINP;
    viscol[S_AVGP] = IsVis ("avgp", o) || defsort1 === S_AVGP || defsort2 === S_AVGP;
    viscol[S_MAXP] = IsVis ("maxp", o) || defsort1 === S_MAXP || defsort2 === S_MAXP;
    viscol[S_RPOP] = IsVis ("rpop", o) || defsort1 === S_RPOP || defsort2 === S_RPOP;
    viscol[S_INF] = IsVis ("inf", true) || defsort1 === S_INF|| defsort2 === S_INF;
    viscol[S_DEN] = IsVis ("den", o) || defsort1 === S_DEN || defsort2 === S_DEN;
    viscol[S_ADEN] = IsVis ("aden", o) || defsort1 === S_ADEN || defsort2 === S_ADEN;
    viscol[S_MDEN] = IsVis ("mden", o) || defsort1 === S_MDEN || defsort2 === S_MDEN;
    viscol[S_HEAT] = IsVis ("heat", o) || defsort1 === S_HEAT || defsort2 === S_HEAT;
    viscol[S_TEMP] = IsVis ("temp", o) || defsort1 === S_TEMP || defsort2 === S_TEMP;
    viscol[S_VOL] = IsVis ("vol", o) || defsort1 === S_VOL || defsort2 === S_VOL;
    viscol[S_SVOL] = IsVis ("svol", o) || defsort1 === S_SVOL || defsort2 === S_SVOL;
    viscol[S_RVOL] = IsVis ("rvol", o) || defsort1 === S_RVOL || defsort2 === S_RVOL;
    viscol[S_SYMM] = IsVis ("symm", true) || defsort1 === S_SYMM || defsort2 === S_SYMM;
    viscol[S_GLIDE] = IsVis ("glide", o) || defsort1 === S_GLIDE || defsort2 === S_GLIDE;
    viscol[S_BOXW] = IsVis ("boxw", true) || defsort1 === S_BOXW || defsort2 === S_BOXW;
    viscol[S_BOXH] = IsVis ("boxh", true) || defsort1 === S_BOXH || defsort2 === S_BOXH;
    viscol[S_BOXD] = IsVis ("boxd", true) || defsort1 === S_BOXD || defsort2 === S_BOXD;
    viscol[S_BOXC] = IsVis ("boxc", true) || defsort1 === S_BOXC || defsort2 === S_BOXC;
    viscol[S_BOXA] = IsVis ("boxa", true) || defsort1 === S_BOXA || defsort2 === S_BOXA;
    viscol[S_BOXS] = IsVis ("boxs", true) || defsort1 === S_BOXS || defsort2 === S_BOXS;
    viscol[S_LBOXW] = IsVis ("lboxw", o) || defsort1 === S_LBOXW || defsort2 === S_LBOXW;
    viscol[S_LBOXH] = IsVis ("lboxh", o) || defsort1 === S_LBOXH || defsort2 === S_LBOXH;
    viscol[S_LBOXD] = IsVis ("lboxd", o) || defsort1 === S_LBOXD || defsort2 === S_LBOXD;
    viscol[S_LBOXC] = IsVis ("lboxc", o) || defsort1 === S_LBOXC || defsort2 === S_LBOXC;
    viscol[S_LBOXA] = IsVis ("lboxa", o) || defsort1 === S_LBOXA || defsort2 === S_LBOXA;
    viscol[S_LBOXS] = IsVis ("lboxs", o) || defsort1 === S_LBOXS || defsort2 === S_LBOXS;
    viscol[S_HULLW] = IsVis ("hullw", o) || defsort1 === S_HULLW || defsort2 === S_HULLW;
    viscol[S_HULLH] = IsVis ("hullh", o) || defsort1 === S_HULLH || defsort2 === S_HULLH;
    viscol[S_HULLD] = IsVis ("hulld", o) || defsort1 === S_HULLD || defsort2 === S_HULLD;
    viscol[S_HULLC] = IsVis ("hullc", o) || defsort1 === S_HULLC || defsort2 === S_HULLC;
    viscol[S_HULLA] = IsVis ("hulla", o) || defsort1 === S_HULLA || defsort2 === S_HULLC;
    viscol[S_HULLS] = IsVis ("hulls", o) || defsort1 === S_HULLS || defsort2 === S_HULLS;
    viscol[S_RBOXW] = IsVis ("rboxw", q) || defsort1 === S_RBOXW || defsort2 === S_RBOXW;
    viscol[S_RBOXH] = IsVis ("rboxh", q) || defsort1 === S_RBOXH || defsort2 === S_RBOXH;
    viscol[S_RBOXD] = IsVis ("rboxd", q) || defsort1 === S_RBOXD || defsort2 === S_RBOXD;
    viscol[S_RBOXC] = IsVis ("rboxc", q) || defsort1 === S_RBOXC || defsort2 === S_RBOXC;
    viscol[S_RBOXA] = IsVis ("rboxa", q) || defsort1 === S_RBOXA || defsort2 === S_RBOXA;
    viscol[S_RBOXS] = IsVis ("rboxs", q) || defsort1 === S_RBOXS || defsort2 === S_RBOXS;
    viscol[S_ACT] = IsVis ("act", q) || defsort1 === S_ACT || defsort2 === S_ACT;
    viscol[S_NROT] = IsVis ("nrot", q) || defsort1 === S_NROT || defsort2 === S_NROT;
    viscol[S_PER] = IsVis ("per", true) || defsort1 === S_PER || defsort2 === S_PER;
    viscol[S_MOD] = IsVis ("mod", o) || defsort1 === S_MOD || defsort2 === S_MOD;
    viscol[S_RMOD] = srch.s_rmods !== 7 || defsort2 === S_RMOD || defsort2 === S_RMOD;
    viscol[S_VEL] = IsVis ("vel", v) || defsort1 === S_VEL|| defsort2 === S_VEL;
    viscol[S_SLP] = IsVis ("slp", v) || defsort1 === S_SLP || defsort2 === S_SLP;
    viscol[S_GLS] = IsVis ("gls", true) || defsort1 === S_GLS || defsort2 === S_GLS;
    viscol[S_RGLS] = IsVis ("rgls", true) || defsort1 === S_RGLS || defsort2 === S_RGLS;
    viscol[S_GLNA] = IsVis ("glna", s) || defsort1 === S_GLNA || defsort2 === S_GLNA;
    viscol[S_GLNR] = IsVis ("glnr", s) || defsort1 === S_GLNR || defsort2 === S_GLNR;
    viscol[S_FREQ] = IsVis ("freq", r) || defsort1 === S_FREQ || defsort2 === S_FREQ;
    viscol[S_RAR] = IsVis ("rar", r) || defsort1 === S_RAR || defsort2 === S_RAR;
    viscol[S_TTS] = IsVis ("tts", m) || defsort1 === S_TTS || defsort2 === S_TTS;
    viscol[S_EF] = IsVis ("ef", m) || defsort1 === S_EF || defsort2 === S_EF;
    viscol[S_CAT] = IsVis ("cat", true) || defsort1 === S_CAT || defsort2 === S_CAT;
    viscol[S_NBR] = IsVis ("nbr", true) || defsort1 === S_NBR || defsort2 === S_NBR;
    viscol[S_HDR] = IsVis ("hdr", true) || defsort1 === S_HDR || defsort2 === S_HDR;
    viscol[S_FILE] = IsVis ("file", true) || defsort1 === S_FILE || defsort2 === S_FILE;
    viscol[S_APG] = IsVis ("apg", true) || defsort1 === S_APG || defsort2 === S_APG;
    viscol[S_SOF] = IsVis ("sof", true) || defsort1 === S_SOF || defsort2 === S_SOF;
    viscol[S_LIS] = IsVis ("lis", true) || defsort1 === S_LIS || defsort2 === S_LIS;
    viscol[S_HRD] = IsVis ("hrd", q) || defsort1 === S_HRD || defsort2 === S_HRD;
    viscol[S_WIKI] = IsVis ("wiki", true) || defsort1 === S_WIKI || defsort2 === S_WIKI;
    viscol[S_PAT] = IsVis ("pat", true) || defsort1 === S_PAT || defsort2 === S_PAT || !ifcan;
    viscol[S_IMG] = ifcan;	// defsort1 === S_IMG || defsort2 === S_IMG
    viscol[S_NATIVE] = false;	// defsort1 === S_NATIVE || defsort2 === S_NATIVE
    for (glidercol = nviscol = i = 0; i < S_MAX; ++i) {	// Count visible columns
	nviscol += viscol[i];
	if (i < S_GLS) {
	    glidercol += viscol[i];
	}
    }
    for (r = 0, j = 0; r < R_MAX; ++r) {		// Count lines
	n = nresults[r];				// Number of matches this rule
	if (n && nrules > 1) {				// Rule header, if more than one rule
	    ++j;
	}
	j += n * expanded[r];
    }
    npages = max (1, ceil (j / maxlist));		// Number of pages
    pageno = max (0, min (page, npages-1));		// Reasonable page number
    SortScroll ("");					// Set up navigation buttons
    SortScroll ("2");
    i = GetRows ("tablist");
    if (i.length > 0) {					// Clear URL-rich bottom header row
	TruncRow (i[i.length-1], 0);
    }
    SortHdr ("tablist", 0);				// Draw column headers at the top
    j = 1 - Mul (pageno, maxlist);			// (OK if maxlist=_ and pageno=0)
    for (r = 0; r < R_MAX && j <= maxlist; ++r) {
	n = nresults[r];				// Number of matches this rule
	if (n && nrules > 1) {
	    if (j > 0) {
		var tr = AddRow ("tablist", j, (expanded[r] ? "+" : "-") + " " +
		  rulenames[r] + ": (" + n + " " +
		  (n !== 1 ? smatches : smatch) + " " + sfound + ")",
		  r, 0, true, -1, C_ROW_RULE);
	    }
	    ++j;
	}
	rulefirst[r] = j;
	n *= expanded[r];
	for (var i = 0; i < n && j <= maxlist; ++i, ++j) {
	    if (j <= 0) {				// Ignore items on page before this one
		continue;
	    }
	    var p = results[r][i];
	    tr = AddRow ("tablist", j, p, r, i, false, 0, GlColors (p.p_gls, p.p_minp, C_BG));
	    if (p === selectb) {
		selecti = j;
		SetRowBg (tr, C_ROW_SEL, C_row_sel, p.p_gls, p.p_minp, r, p);
	    }
	}
    }
    SortHdr ("tablist", j++);			// Draw column headers at the bottom
    TruncTable ("tablist", j);
}
// Re-sort solutions based on selected criteria, and generate table or stamp
// Last rule found is returned. This is THE rule, if exactly one match.
// Actual sorting is not needed if merely paging.
function Sort (sort, page) {
    var therule = srch.s_rules;
    nrules = 0;
    selecti = -1;
    for (var r = 0; r < R_MAX; ++r) {
	if (nresults[r] > 0) {
	    sortrule = r;
	    if (sort) {
		results[r] = results[r].sort (SortCmp);
	    }
	    ++nrules;
	    therule = r;
	}
    }
    if (nfound === 0) {			// No solutions
    } else if (view === V_LIST) {	// List view
	ShowB ("viewstamp", false);
	SortList (page);
	ShowB ("viewtab", true);
	ShowB ("viewnav", true);
    } else {				// Stamp view
	ShowB ("viewtab", viewtab);
	SortStamp (page, -1, true);
	ShowB ("viewstamp", true);
	ShowB ("viewnav", true);
    }
    r = view === V_LIST ? maxlist : stampx * stampy;
    SetText ("txtstatus", sFound + " " + nfound + " " +
      (nfound !== 1 ? smatches : smatch) + (nfound > r ?
      "; " + r + " " + (r ===1 ? sis_shown_per_page : sare_shown_per_page) : "") + ".");
    return therule;
}
// Compute background color, based on number of gliders
function GlColors (g, pop, def) {
    if (g === KNOWN) {		// Known: blue
	return C_GLS_KNOWN;
    } else if (g === TBD) {	// TBD: grey
	return C_GLS_TBD;
    } else if (g > UNKNOWN) {	// Partial: orange
	return C_GLS_PART;
    } else if (g === UNKNOWN) {	// Unknown: red
	return C_GLS_X;
    } else if (g > pop) {	// Over par: yellow
	return C_GLS_GT;
    } else if (g === pop) {	// Par: green
	return C_GLS_EQ;
    } else {			// Under par: white (or default)
	return def;
    }
}
// Set exported text area content and select it
function Enter (txt) {
    ShowR ("viewexport", true);
    ShowR ("viewexported", true);
    SetValue ("inexported", txt);
    Select ("inexported");
    Focus ("inexported");
}
// Compose a search comment, based on a search criterion
function Comment (m, x, y, name, prefix, rar, u) {
    var p = rar ? -_ : _;	// rarity treats _ as unknown
    switch (m) {
    default:						// huh?
	return AddComment (prefix + name + " ?");
    case M_ANY:						// All
	return "";
    case M_INF:						// n = infinity
	if (!rar) {		// rarity treats _ as unknown
	    return AddComment (prefix + name + " = infinity");
	}
    case M_NAN:						// n = unknown
	return AddComment (prefix + name + " = unknown");
    case M_UNKNOWN:					// n >= "x"
	return AddComment (prefix + name + " >= x");
    case M_PARTIAL:					// n > "x"
	return AddComment (prefix + name + " > x");
    case M_TBD:						// n = TBD
	return AddComment (prefix + name + " = TBD");
    case M_KNOWN:					// n = known
	return AddComment (prefix + name + " = known");
    case M_EQ:						// n === y
	return AddComment (prefix + name + " = " + RealName (y, p, 0, u));
    case M_NE:						// n !== y
	return AddComment (prefix + name + " !== " + RealName (y, p, 0, u));
    case M_LT:						// n < y
	return AddComment (prefix + name + " < " + RealName (y, p, 0, u));
    case M_LE:						// n <= y
	return AddComment (prefix + name + " <= " + RealName (y, p, 0, u));
    case M_GT:						// n > y
	return AddComment (prefix + name + " > " + RealName (y, p, 0, u));
    case M_GE:						// n >= y
	return AddComment (prefix + name + " >= " + RealName (y, p, 0, u));
    case M_IN:						// x <= n <= y
	return AddComment (prefix + RealName (x, p, 0, u) + " <= " + name + " <= " +
	  RealName (y, p, 0, u));
    case M_OUT:						// n < x || y < n
	return AddComment (prefix + name + " < " + RealName (x, p, 0, u) +
	  " or " + RealName (y, p, 0, u) + " < " + name);
    }
}
// Add a fixed comment string, on a separate line, if not empty
function AddComment (s) {
    return s.length ? "#C " + s + "\n" : "";
}
// Handle each piece of a wildcard pattern piece, after being cut along tildes
function WildTilde (t, w, ok, wild) {
    t = t.replace(/[$()*+.?^[\\\]{|}]/g, "\\$&");	// Make all special characters literal
    if (wild) {					// All except LIS:
	t = t.replace (/\\\*/g, ".*");		// * => match any number of any character
    }
    if (w & W_BEGINS) {				// Begins with y => y*
	t += ".*";
    }
    if (w & W_ENDS) {				// Ends with y => *y
	t = ".*" + t;
    }
    if (w & W_ANY) {				// Any => *
	t = ".*";
    }
    if (ok) {					// All except LIS and SOF:
	t = t.replace (/\\\?/g, ".");		// ? => match any character
    }
    t = t.replace (/(\.\*)+/g, ".*");		// ** => *
    t = "^" + t + "$";				// Add anchors
    t = t.replace (/\.\*\$$/, "");		// *$ => no need to check end
    return t;
}
// Handle each piece of a wildcard pattern name, after being cut along commas
function WildComma (t, w, ok, wild) {
    var i;
    t = ok ? t.split ("~") : [t];		// Cut into a~b~c..
    for (i = 0; i < t.length; ++i) {		// Include a; exclude b, c, ...
	t[i] = WildTilde (t[i], w, ok, wild);
    }
    if (t.length === 1) {			// a is just a
	return t[0];
    }
    var r = t[0].length ? "^(?=" + t[0] + ")" : "^";	// Optionally include first piece
    for (i = 1; i < t.length; ++i) {		// Optionally exclude all the others
	if (t[i].length) {
	    r += "(?!" + t[i] + ")";
	}
    }
    return r;
}
// Convert a neighborhood string into a neighborhood mask
function Nbr2Mask (s) {
    var m = 0;
    var b = 1;
    var p = BPLUS;
    for (var i = 0; i < s.length; ++i) {
	var c = s[i];
	if (c === "b") {
	    b = 0;
	    p = BPLUS;
	} else if (c === "s") {
	    b = 1;
	    p = BPLUS;
	} else if (c === "/") {
	    b ^= 1;
	    p = BPLUS;
	} else if (c === "+") {
	    p = BPLUS;
	} else if (c === "-") {
	    p = BMINUS;
	} else if ((c = "012345678".indexOf (c)) >= 0) {
	    if (! (floor (m / (p * (b ? SPLUS : BPLUS))) & (1 << c))) {
		m += p * ((b ? SPLUS : BPLUS) << c);
	    }
	}
    }
    return m;
}
// Convert a birth or survival neighborhood mask into a digit string
function Mask2Nbr2 (m, p) {
    var s = m&0x1FF ? p : "";
    for (var i = 0; i < 9; ++i) {
	if (m & (1 << i)) {
	    s += "012345678"[i];
	}
    }
    return s;
}
// Convert a birth or survival neighborhood mask into a three-part string
function Mask2Nbr1 (m, u) {
    return Mask2Nbr2 (m%BMINUS, "") + Mask2Nbr2 (floor (m/BMINUS)%BMINUS, "-") +
      (u ? Mask2Nbr2 (BMINUS-1 - (m%BMINUS | floor(m/BMINUS)), "~") : "");
}
// Convert a neighborhood mask into a neighborhood string
function Mask2Nbr (m, u) {
    return "B" + Mask2Nbr1 (m, u) + "/S" + Mask2Nbr1 (floor (m / SPLUS), u);
}
// Convert a neighborhood mask into Log2 (number of possible rules)
function Mask2Count (m) {
    for (var i = 0, m = BMINUS-1 - (m%BMINUS | (floor (m/BMINUS))); m; m >>= 1) {
	i += m & 1;
    }
    return i;
}
// Set text foreground and table cell background to indicate active filter
// disabled=grey, inactive=grey on white, active=black on yellow
function ActiveText (n, q, a) {
    GreyText ("in"+n+"e", a);
    SetBg ("in"+n+"d", q ? a ? C_BG_ACTIVE : C_BG : C_BG_GREY);
}
// Set a selection checkmark to a specified value
function LoadChecked (n, s) {
    SetChecked ("in"+n+"e", parseInt (s));
}
// Set a selection control to a specific numeric value, if possible
function LoadSel (id, n, q) {
    if (q) {
	LoadChecked (id, "1");
    }
    id = Id ("in"+id+"s");
    var o = GetOptions (id);
    var s = IsString (n);
    for (var i = 0; i < id.length; ++i) {
	var v = GetValue (o[i]);
	if (n === (s ? v : ParseEnum (v))) {
	    SetSel (id, i);
	    break;
	}
    }
}
// Load a set of controls for searching one criterion by number
function LoadNum (n, s) {
    LoadChecked (n, "1");
    for (var i = 0; i < M_MAX; ++i) {
	var j = s.indexOf (cmpenum[i]);
	if (j >= 0) {
	    var x = s.substring (0, j);
	    var y = s.substring (j+1);
	    LoadSel (n, i);
	    SetValue ("in"+n+"xt", x);
	    SetValue ("in"+n+"yt", y);
	    break;
	}
    }
}
// Load a set of controls for searching one criterion by name
function LoadName (n, s) {
    LoadChecked (n, "1");
    LoadSel ("in"+n+"s", wildenum.indexOf (s[0]));
    SetValue ("in"+n+"t", s.subString (1));
}
// Evaluate a constant that is either a number or an enum; return NaN on error.
function ParseEnum (s) {
    var n = parseInt (s);
    return isNaN (n) ? ("number" === typeof (s = window[s])) ? s :
      NaN : parseFloat (s);
}
// Evaluate an select control's value that is either a number or an enum
function EvalSel (id) {
    return ParseEnum (GetValue (id));
}
// Get value from an input field, replacing semicolons by commas
function GetComma (id) {
    return GetValue (id).replace (/;/g, ",");
}
// See if a criterion row is visible and active
function IsVis (n, e) {
    return e && GetChecked ("in"+n+"e");		// Is row visible?
}
// See if a criterion row is visible and active
function CritVis (b, s, n, e) {
    s.s_bar[b] |= e = IsVis (n, e);			// Is row visible?
    ShowR ("in"+n+"r", e);
    for (var j = 1; j < 5; ++j) {
	var o = GetOptions ("incons"+j);
	for (var i = 1; i < o.length; ++i) {
	    if (n === GetValue (o[i])) {
		SetOtext (o[i], (e ? Ucheck : Uenspace) + GetOtext (o[i]).substring (1));
	    }
	}
    }
    return e;
}
// Input a generic comparison criterion for a numeric parameter
// Several criteria have additional non-standard semantics
// (These are easier to include here, than to deal with them after the fact):
// - "vel": velocity: is rational and has separate denominator and direction
// - "gls": gliders: ? is interpreted differently
// - "rgls": relative gliders: "
// - "rar": rarity: ? is interpreted differently;
// - "mod": modulus: also add period/modulus
function CritNum (b, s, n, c, e, u) {
    e = CritVis (b, s, n, e);
    var v = n === "vel";			// Velocity: rational
    var d = n === "gls" || n === "rgls";	// Gliders: ? => x
    var r = n === "rar";			// Rarity: ? => _
    var nan = d ? UNKNOWN : (r ? _ : NaN);	// What ? translates to
    var f = "in" + n;				// Input control name prefix
    var m = e ? EvalSel (f + "s") : M_ANY;	// Comparison type
    var x = (m >= M_IN) ? 1 : 0;		// Is x parameter used?
    var y = (m >= M_EQ) ? 1 : 0;		// Is y parameter used?
    saves.push (n + "=" + encodeURIComponent (
      (x ? GetValue (f + "xt") : "") + cmpenum[m] + (y ? GetValue (f + "yt") : "")));
    var i;
    ShowI (f + "s", e);				// Show selection drop-down?
    ShowI (f + "xt", x);			// Show x parameter?
    ShowI (f + "yt", y);			// Show y parameter?
    if (x) {					// Get x parameter
	x = GetValue (f + "xt");
	if (v) {
	    x = x.replace (/c/gi, "*");
	}
	x = ParseLfloats (x, nan);
    }
    if (y) {					// Get y parameter
	y = GetValue (f + "yt");
	if (v) {
	    y = y.replace (/c/gi, "*");
	}
	y = ParseLfloats (y, nan);
    }
    if (m >= M_IN && !IsArray (x) && !IsArray (y) && y < x) {
	i = x;					// x-y is always x<n<y, never x>n>y
	x = y;
	y = i;
    }
    s["s_" + n + "s"] = m;			// Save search constraint
    s["s_" + n + "x"] = x;			// Save search x parameter
    s["s_" + n + "y"] = y;			// Save search y parameter
    var g = m !== M_ANY;
    var o = "";
    if (v) {					// Velocity: add denominator and direction
	x = Rational (x, CT);
	y = Rational (y, CT);
	i = GCD (y[1], x[1], CT);		// Unify both velocity denominators
	x[0] *= y[1] / i;
	y[0] *= x[1] / i;
	y[1] *= x[1] / i;
	s.s_veld = i = y[1];
	s.s_velx = x = x[0];
	s.s_vely = y = y[0];
	ShowI ("invelov", e);
	ShowI ("invelos", e);
	s.s_velo = e ? EvalSel ("invelos") : D_ANY;
	g |= s.s_velo !== D_ANY;
	x = VelNames (x, i, m);
	y = VelNames (y, i, m);
	o = dirnames[s.s_velo];
	if (e) {
	    saves.push ("dir=" + direnum[EvalSel ("invelos")]);
	}
    } else {				// All others just use real numbers
	x = RealNames (x, -1-d-8*r, m, u);	// (but rarity treats _ and NaN differently
	y = RealNames (y, -1-d-8*r, m, u);	//  and gliders treat KNOWN+TBD+UNKNOWN specially)
    }
    s.s_comm += Comment (m, x, y, c, o, r, u);	// Comment
    if (n === "mod") {			// Modulus: add period/modulus
	s.s_rmods = e ? EvalSel ("inrmods") : 7;
	s.s_comm += AddComment (resnames[s.s_rmods]);
	g |= s.s_rmods !== 7;
	GreyText ("inrmodv", s.s_rmods !== 7);
	saves.push ("rmod=" + EvalSel ("inrmods"));
    }
    ActiveText (n, e, g);
}
// Add a search criterion based on a name, possibly with wild cards
function CritName (b, s, n, c, e) {
    e = CritVis (b, s, n, e);
    var w = s["s_w" + n] = e ? EvalSel ("in"+n+"s") : W_ANY;	// Matching type
    var t = DumbQuote ((e ? GetValue ("in"+n+"t") : "").replace (/[\t\r]/g, ""));
    if (e) {
	saves.push (n + "=" + wildenum[w] + encodeURIComponent (t));
    }
    var lis = n === "lis";				// LIS?
    var sof = n === "sof";				// SOF?
    var hrd = n === "hrd";				// HRD?
    var wild = !lis;					// All but LIS allow wildcards
    if (!lis && !sof&& !hrd) {				// LIS, SOF, HRD use dual-case names
	t = t.toLowerCase ();
    }
    var ok = !lis && !sof;				// LIS, SOF allow ; in image
    if (ok) {
	t = t.replace (/;/g, ",");
    }
    switch (n) {
    case "pat":						// Constrain by pattern name
	t = t.replace (/with/g, "w/");			// Replace "with" by "w/"
	t = t.replace (/\xD7/g, "x");			// Replace multiplication sign by "x"
	t = t.replace (/[^$*,.0-9?a-z~\xFC]/g, "");	// Strip all punctuation except . $ \uuml
	if (w === W_IS && (i = t.indexOf (".")) > 0) {	// Narrow still-lifes: m.n
	    j = parseInt (t);
	    i = parseInt (t.substring (i+1));
	    if (i > 0 && j > 0 && t === j + "." + i){
		s.s_pop = j;
		s.s_idx = i;
	    }
	}
	break;
    case "file":					// Constrain by file name
	if (t.indexOf ("//") < 0) {			// Don't alter URLs!
	    if ((i = t.lastIndexOf ("/")) >= 0) {	// Strip path from RLE
		t = t.substring (i+1);
	    }
	    if ((i = t.indexOf (".")) >= 0) {		// Strip extension from RLE
		t = t.substring (0, i);
	    }
	    t = t.replace (/[^-*,0-9?a-z~]/g, "");	// Strip all punctuation except -
	}
	break;
    case "apg":						// Constrain by apg search name
	t = t.replace (/[^*,0-9?_a-z~]/g, "");		// Strip all punctuation except _
	if (w === W_IS && t.search ("[*,?~]") < 0) {
	    s.s_ApgName (t);				// Only optimize search if one simple name
	}
	break;
    case "sof":						// Constrain by SOF name
	t = t.replace (/[ .]/g, "");			// Strip trailing . (just implied here) and white space
	break;
    case "hrd":						// Constrain by HRD
	t = t.replace (/ +/g, " ")			// Strip extra and trailing white space
    case "lis":						// Constrain by LIS name
	t = t.replace (/ *$/g, "");			// Strip trailing white space
	break;
    case "wiki":					// Constrain by LifeWiki name
	t = t.replace (/ /g, "_");			// Replace all spaces by underscores
	t = t.replace (/[^-$"()*,./0-9;?^_a-z~]/g, "");	// Strip all punctuation except $"()-./^_
	break;
    case "hdr":						// Constrain by header
	t = t.replace (/[^-*,0-9?a-z~]/g, "");		// Strip all punctuation except -
	break;
    }
    if (w !== W_ANY) {
	s.s_comm += AddComment (c + " " + wildnames[w] + " " + t);
    }
    t = wild ? t.split (",") : [t];			// One or more inclusive names
    for (i = 0; i < t.length; ++i) {
	t[i] = WildComma (t[i], w, ok, wild);
    }
    for (var i = 0, j = ""; i < t.length; ++i) {
	if (t[i].length) {
	    j += "|(?=" + t[i] + ")";
	}
    }
    j = j.substring (1);				// Remove leading |
    if (t.length > 1) {					// a, or (a|b) or (a|b|c)...
	j = "(" + j + ")";
    }
    j = "^" + j;					// From start of line
    s["s_p" + n] = new RegExp (j, n === "pat" ? "i" : "");
    ActiveText (n, e, w !== W_ANY);
    ShowI ("in"+n+"t", w !== W_ANY);
}
// Add a search criterion based on neighborhood
function CritNbr (b, s, n, c, e) {
    e = CritVis (b, s, n, e);
    var t = GetValue ("in"+n+"t");
    var i = s["s_"+n] = e ? Nbr2Mask (t.toLowerCase ().replace (/[^-bs012345678]/g, "")) : 0;
    ActiveText (n, e, i = i !== 0);
    if (e) {
	saves.push (n + "=" + encodeURIComponent (t));
    }
    if (i) {
	s.s_comm += AddComment (c + " = " + Mask2Nbr (i));
    }
}
// Add a search criteron based on a selection
function CritSel (b, s, n, c, e, d, z, l, v) {
    e = CritVis (b, s, n, e);
    var i = s["s_"+n+"s"] = e ? EvalSel ("in"+n+"s") : z;
    ActiveText (n, e, i !== d);
    if (e) {
	saves.push (n + "=" + l[i]);
    }
    if (i !== d) {
	s.s_comm += AddComment (c + v[i]);
    }
}
// Add a search criterion based on a checkbox
function CritCheck (b, s, n, c, e) {
    e = CritVis (b, s, n, e);
    s["s_"+n] = e;
    ActiveText (n, e, e);
    if (e) {
	saves.push (n + "=");
	s.s_comm += AddComment (c);
    }
}
// Add a search criterion based on one or more categories
function CritCat (b, s, n, c, e) {
    e = CritVis (b, s, n, e);
    var t = e ? EvalSel ("incats") : OM_ALL;
    ShowI ("indots", i = t === OM_MULTI);
    if (t === OM_MULTI) {
	t = GetBoxes ();
    }
    for (var i = 0, j = ""; i < O_MAX; ++i) {
	if (t & (1 << i)) {
	    j += catenum[i];
	}
    }
    s["s_"+n+"s"] = t;
    ActiveText (n, e, t !== OM_ALL);
    if (e) {
	saves.push (n + "=" + (t === OM_ALL ? "a" : j));
    }
    return e;
}
// Is this single line of text a valid SOF code? sofchars* . space* [(name)] space* [!comment]
function ValidSof (t) {
    return t.search (/^[-+0-~]*\.[ \t]*(\([^)]*\))?[ \t]*(!.*)?\n/) >= 0;
}
// Is this single line of text a valid APG code?
var alldigits = /^[0-9]+$/;					// One or more digits
var allapgchars = /^[0123456789abcdefghijklmnopqrstuvwxyz]*$/;	// Zero or more apg characters
function ValidApg (t) {
    var i = t.indexOf ("_");
    if (i <= 0) {
	return false;
    }
    var prefix = t.substr (0, i);
    var suffix = t.substr (i+1);
    var signif = prefix.substr (0, 2);
    if (t.substr (0, 3) == "zz_" || t.substr (0, 3) == "ov_" || t == "PATHOLOGICAL") {	// special cases
	return true;
    } else if (signif == "xs" || signif == "xp" || signif == "xq") {	// [xs|xp|xq] digit+ _ alnum*
	return prefix.substr (2).search (alldigits) >= 0 && suffix.search (allapgchars) >= 0;
    } else if (signif == "yl") {				// yl digit+ _ digit+ _ upper*
	i = suffix.indexOf ("_");
	return i > 1 && prefix.substr (2).search (alldigits) >= 0 &&
	  suffix.substr (0, i).search (alldigits) >= 0 &&
	  suffix.substr (i+1).search (allapgchars) >= 0;
    }
    return false;
}
// Count bit populations
function BitPop (i) {
    var n;
    for (n = 0; i; i >>= 1) {
	n += i&1;
    }
    return n;
}
var bitpops = new Array (1<<13).fill (0).map ((x, i) => BitPop (i));
// Is this single line of text a valid LIS code?
// (NOTE: LIS might be erroneously interpreted as APG in the following cases, if data matches,
//  and if bounding box (xp, xq, xs) or modulus (yl) is (16-25)x(16-25) or 63x(16-25):
//  80P88(xp), 81P88(xq), 83P88(xs), 76P89(yl), 90P90(zz), 33P48(PATHOLOGICAL)
//  (but it's unlikely that such a pattern's bit image would be valid APG characters))
function ValidLis (t) {
    var period = t.charCodeAt (0) - A_SP;	// Get period, population, height, width from header
    var pop = t.charCodeAt (1) - A_SP;
    var height = t.charCodeAt (2) - A_SP;
    var width = t.charCodeAt (3) - A_SP;
    var cells = 0;
    if (t.length < 4 || period <= 0 || pop < 0 || height < 0 || width < 0 || t.length > 4 + ceil (width/6) * height) {
	return 0;				// Validate header information
    }
    for (var i = t.length; --i >= 4; ) {	// Count actual cell population
	var c = t.charCodeAt (i) - A_SP;
	if (c < 0) {
	    return 0;
	} else if (c < 64) {
	    cells += bitpops[c];
	}
    }
    return (cells == pop || cells > 223) && [period, pop, height, width];	// Make sure cells match population (or exceed header capability)
}
// Add a search criterion based on image
function CritImg (b, s, n, c, e) {
    e = CritVis (b, s, n, e);
    var fmt = EvalSel ("inimgs");			// Input format
    ShowI ("inimgf", fmt == X_IMAGE);
    var t = e ? GetValue ("in"+n+"t").replace (/\r/g, "").replace (/\r\n/g, "\n").replace (/\t/g, " ").replace (/ *\n*$/, "") : "";
    var k = "";						// Comments
    var f;						// Field structure
    var i = max (2, min (1000, parseInt (GetValue ("inimgh")) || 0));
    SetRows ("inimgt", i);
    saves.push ("imgh=" + i);
    saves.push ("image=" + encodeURIComponent (t));
    var c = t + "\n";					// Text with leading comments removed
    while (c.length && (((i = c[0]) === "#") || i === "!")) {	// Strip comments
	i = c.indexOf ("\n");
	var j = c.substring (0, i);
	c = c.substring (i+1);
	if (fmt === X_IMAGE && j === s_Life_1_05) {
	    fmt = X_LIFE105;
	} else if (fmt === X_IMAGE && j === s_Life_1_06) {
	    fmt = X_LIFE106;
	} else {
	    k += j.replace (/^!/, "#C");
	}
    }
    var rle = c.replace (/[ \t]/g, "");			// No white space in RLE
    var lis;						// LIS header information
    i = t.indexOf ("\n");
    if (fmt !== X_IMAGE) {				// Explicit format: no auto-detect
    } else if (i > 0 && rle.substring (0, 2) === "x=") {	// RLE header: must be RLE
	fmt = X_RLE;
	if ((i = rle.indexOf ("\n")) > 0) {
	    var h = rle.substring (0, i);		// RLE header
	    rle = rle.substring (i+1);
	    for (;; h = h.substring (i+1)) {		// For each clause on RLE header:
		if (h.substring (0, 5) === "rule=") {	// Parse rule clause; ignore others
		    s.s_rules = RleRule (h.substring (5), true);
		}
		if ((i = h.indexOf (",")) < 0) {
		    break;				// Stop if no comma continuation
		}
	    }
	}
    } else if (i < 0 && ValidSof (t)) {			// sofchars* . space* [(name)] space* [!comment] = SOF
	fmt = X_SOF;
    } else if (i < 0 && ValidApg (t)) {			// [xs|xp|xq] digit+ _ alnum* | yl digit+ _ digit+ _ alnum* | zz_ upper+
	fmt = X_APG;
    } else if (i < 0 && (lis = ValidLis (t))) {		// period population width height char*
        fmt = X_LIS;
    } else if (rle.indexOf ("!") >= 0) {		// ! is end of RLE data
	fmt = X_RLE;
    } else {						// Default: Cells
	fmt = X_CELLS;
    }
    if (k.length || rle.length) {			// Ignore empty patterns; read others
	switch (fmt) {
	case X_CELLS:					// Default: Read plain text format
	case X_LIFE105:					// Read Life 1.05 format
	    f = Text2Bin (c, 2);
	    break;
	case X_LIFE106:					// Read Life 1.06 format
	    f = Life2Bin (c, 2);
	    break;
	case X_RLE:					// Read RLE format
	    f = Rle2Bin (rle, 2);
	    break;
	case X_SOF:					// Read SOF format
	    f = Sof2Bin (t, 2);
	    break;
	case X_LIS:					// Read LIS format
	    f = Lis2Bin (t, 2, lis);
	    s.s_apgper = lis[0];
	    s.s_apgcat = lis[0] == 1 ? O_STILL : O_OSC;
	    s.s_apgcats = (lis[0] == 1 ? OM_STILL : OM_OSCS) | OM_MOVES;
	    if (lis[0] == 1) {
		s.s_minp = lis[1];
	    }
	    break;
	case X_APG:					// Read apg search format
	    t = t.toLowerCase ().replace (/[^*,?0-9;_a-z~]/g, "");
	    s.s_ApgName (t);				// Strip all punctuation except _
	    f = Apg2Bin (t, 2, 1);
	    if (s.s_apgcats === OM_NONE) {		// Can't show unknown!
		s.s_fail = true;
	    }
	    break;
	}
	fmt = ": " + expnames[fmt];
    } else {
	fmt = sAny;
    }
    SetText ("inimgf", fmt);				// Deduced format name
    return f;
}
// Add further criteria based on pattern image, once rule has been determined
function CritImg2 (s, f, c) {
    if (f) {
	s.s_still = f.f_IsStill (s.s_rules);
	if ((f.f_rgt - f.f_lft) * (f.f_btm - f.f_top) > LARGE*LARGE) {
	    View (Z_HUGE);				// Pattern too huge to process
	    SetText ("txtstatus", sPattern_too_large + ".");
	    s.s_fail = true;
	}
	var y = new Symm (f, f.f_lft, f.f_top, f.f_rgt, f.f_btm, 0);
	if (f.f_wild < 0) {				// Wildcards present: affect symmetry
	    i = new Symm (f, f.f_lft, f.f_top, f.f_rgt, f.f_btm, 1);
	    y.y_symm = i.y_symm;
	}
	i = y.y_img;
	if (f.f_wild) {					// Ignore empty field
	    s.s_field = f;				// For wildcard pattern match
	    s.s_img = i;
	    s.s_iminp = f.f_minp;			// Implicitly constrain by population
	    s.s_imaxp = f.f_maxp;
	}
	i = GetFirst (i);				// Only actively search for first image
	if (s.s_apgcats === OM_ALL && s.s_rules === R_B3S23) {
	    if (s.s_still === 1) {		// allow search for exotic but stable Life patterns
		s.s_apgcats = OM_STILLS;
		s.s_apgcat = O_STILL;
		s.s_apgper = 1;
		s.s_apgminp = f.f_minp;
	    }
	}
	selectb = new Pattern (0, i, "", f.f_wild < 0 ? "" :
	  (s.s_apgpref.substring (0, 1) === "x" ? s.s_apgpref+Bin2Apgs (f) :
	  (s.s_apgpref.length ? s.s_apgpref : undefined)),
	  "", s.s_apgcat,
	  f.f_minp, f.f_maxp, (f.f_minp+f.f_maxp)/2, f.f_GetInf (),
	  OMEGA, NaN, NaN, NaN, y.y_symm, y.y_wid, y.y_hgt, NaN, NaN,
	  NaN, NaN, NaN, NaN, NaN, NaN, 1, NaN, NaN, NaN, 0, -1);
	if (s.s_apgcats !== OM_ALL) {		// apg search category is known
	    selectb.p_tts = 0;
	    if (! (s.s_apgcats & OM_VELS)) {	// Still-lifes and oscillators don't move
		selectb.p_velx = selectb.p_vely = 0;
		selectb.p_veld = 1;
	    }
	    if (s.s_apgper >= 0) {			// apg search forces object period?
		selectb.p_per = s.s_apgper;
		if (selectb.p_per === 1) {		// still-life, P1 C spaceship: constant population
		    selectb.p_inf = f.f_GetInf ();
		    selectb.p_avgp = selectb.p_maxp = selectb.p_minp;
		    selectb.p_lboxw = selectb.p_boxw = y.y_wid;
		    selectb.p_lboxh = selectb.p_boxh = y.y_hgt;
		}
		if (! (s.s_apgcats &~ OM_STILLS)) {	// Still lifes are even more constrained
		    selectb.p_minp = s.s_apgminp;
		    selectb.p_heat = selectb.p_temp = selectb.p_vol = selectb.p_svol = 0;
		    selectb.p_hullw = y.y_wid;
		    selectb.p_hullh = y.y_hgt;
		}
	    }
	}
    }
    SetRule (s.s_rules);
    s.s_cats &= s.s_apgcats;
    if (s.s_cats !== OM_ALL) {
	for (var i = 0, j = ""; i < O_ANY; ++i) {
	    if (s.s_cats & (1 << i)) {
		j += ", " + catnames[i];
	    }
	}
	if (s.s_cats === OM_NONE) {
	    j = ", " + snocats;
	}
	s.s_comm = AddComment (scategory + " = " + j.length ? j.substring (2) : "none") + s.s_comm;
    }
}
// Constructor for search criteria
function Searches (now) {
    saves = [];
    selectb = null;						// Invalidate previous selection
    this.s_field = null;					// Uncompressed image
    this.s_img = null;						// Images
    this.s_rules = R_ANY;					// Rule
    this.s_still = -1;						// Is it a still Life? (-1=unsure)
    this.s_pop = 0;						// Specific still-life population
    this.s_idx = 0;						// Specific still-life index
    this.s_apgper = -1;						// apg search period constraint
    this.s_apgminp = -1;					// apg search population constraint
    this.s_apgcat = O_ANY;					// apg search category
    this.s_apgcats = OM_ALL;					// apg search categories
    this.s_apgpref = "";					// apg search prefix
    this.s_fail = false;					// Don't automatically fail
    this.s_comm = "";						// RLE comment
    this.s_bar = [0, 0, 0, 0, 0, 0];
    CritCat (0, this, "cat", s_namecat, true);			// Constrain by category
    var f = CritImg (5, this, "img", s_nameimg, true);		// Constrain by image
    var v = (this.s_cats & OM_VELS) !== 0;			// Velocity allowed?
    var o = (this.s_cats & OM_PERS) !== 0;			// Period allowed?
    var m = (this.s_cats & OM_METH) !== 0;			// Methuselah allowed?
    var s = (this.s_cats & OM_SS) !== 0;			// Spaceship?
    var q = o && (this.s_cats & OM_OSCS) !== 0;			// Has rotor?
    var u = sUnknown;						// Default meaning of NaN
    CritName (4, this, "apg", s_nameapg, true);			// Constrain by apg search name
    CritName (4, this, "file", s_namefile, true);		// Constrain by file name
    CritName (4, this, "hdr", s_namehdr, true);			// Constrain by header name
    CritName (4, this, "hrd", s_namehrd, q);			// Constrain by HRD
    CritNbr (4, this, "nbr", s_namenbr, true);			// Constrain by neighborhood
    CritName (4, this, "lis", s_namelis, true);			// Constrain by LIS name
    CritName (4, this, "pat", s_namepat, true);			// Constrain by pattern name
    CritName (4, this, "sof", s_namesof, true);			// Constrain by SOF name
    CritName (4, this, "wiki", s_namewiki, true);		// Constrain by LifeWiki page
    CritNum (4, this, "glna", s_nameglna, s, sN_A);		// Constrain by glider number (all)
    CritNum (4, this, "glnr", s_nameglnr, s, sN_A);		// Constrain by machine-readable glider number
    CritCheck (0, this, "diff", s_namediff,			// Constrain by difficult still lifes
      (this.s_rules === R_ANY || this.s_rules === R_B3S23) &&
      (this.s_cats & OM_STILL) !== 0);
    if (everexp) {
	CritCheck (0, this, "exp", s_nameexp, everexp);		// Constrain by expanded pattern list
    }
    CritCheck (0, this, "multic", s_namemultic, true);		// Constrain by multi color syntheses
    CritCheck (0, this, "multif", s_namemultif, true);		// Constrain by multiple file names
    CritCheck (0, this, "multin", s_namemultin, true);		// Constrain by multiple pattern names
    CritSel (0, this, "ff", "", q, H_ANY, H_ANY, ffenum, ffnames);	// constrain by P2 oscillator
    CritSel (0, this, "river", "", q, J_ANY, J_ANY, rrenum, rrnames);	// constrain by raging river
    CritSel (0, this, "rot", "", q, B_ANY, B_ANY, rotenum, rotnames);	// constrain by rotator geometry
    CritSel (0, this, "phx", "", o, P_ANY, P_ANY, phxenum, phxnames);	// constrain by phoenix
    if (this.s_rules !== R_ANY) {				// Rule from RLE overrides manual one
	CritVis (0, this, "rule", false);
    } else {
	CritSel (0, this, "rule", s_namerule+"=", true, R_ANY, R_ANY, ruleenum, rulenames);	// constrain by rule
    }
    CritImg2 (this, f);						// Image constraint, after rule is known
    CritSel (0, this, "symm", s_namesymm+"=", true, Y_ANY, Y_ANY, symmenum, symmnames);	// constrain by symmetry
    CritSel (0, this, "glide", s_nameglide+"=", o, Y_ANY, Y_ANY, symmenum, symmnames);	// constrain by glide symmetry
    this.s_pars = EvalSel ("inpars");				// Parity
    saves.push ("parity=" + EvalSel ("inpars"));
    if (this.s_pars !== 7) {
	this.s_comm += AddComment (sparity + " = " + this.s_pars);
    }
    CritNum (1, this, "gls", s_namegls, true, sTBD);		// constrain by number of gliders
    CritNum (1, this, "rgls", s_namergls, true, sTBD);		// constrain by gliders/bit
    CritNum (1, this, "mod", s_namemod, o, u);			// constrain by modulus
    CritNum (1, this, "per", s_nameper, o, u);			// constrain by period
    if (!o) {							// Still-lifes are always period 1
	this.s_pers = M_EQ;
	this.s_pery = 1;
    }
    if (this.s_apgper >= 0) {
	this.s_comm += Comment (M_EQ, 0, this.s_apgper, "", s_nameper, 0, u);
    }
    CritNum (1, this, "avgp", s_nameavgp, o, u);		// constrain by average population
    CritNum (1, this, "maxp", s_namemaxp, o, u);		// constrain by maximum population
    CritNum (1, this, "minp", s_nameminp, true, u);		// constrain by minimum population
    if (this.s_apgminp >= 0) {
	this.s_comm += Comment (M_EQ, 0, this.s_apgminp, "", s_nameminp, 0, u);
    }
    CritNum (1, this, "rpop", s_namerpop, o, u);		// constrain by average population
    CritNum (1, this, "slp", s_nameslp, v, sN_A);		// constrain by slope
    CritNum (1, this, "vel", s_namevel, v, sN_A);		// constrain by velocity
    CritNum (2, this, "act", s_nameact, q, sN_A);		// constrain by active rotor cells
    CritNum (2, this, "aden", s_nameaden, o, u);		// constrain by average density
    CritNum (2, this, "mden", s_namemden, o, u);		// constrain by maximum density
    CritNum (2, this, "den", s_nameden, o, u);			// constrain by minimum density
    CritNum (2, this, "ef", s_nameef, m, u);			// constrain by evolutionary factor
    var r = (this.s_cats & OM_RARS) !== 0 &&
      (this.s_rules === R_ANY || this.s_rules === R_B3S23);	// Rarity allowed?
    CritNum (2, this, "freq", s_namefreq, r, sN_A);		// constrain by frequency
    CritNum (2, this, "heat", s_nameheat, o, u);		// constrain by heat
    CritNum (2, this, "inf", s_nameinf, true, u);		// constrain by influence
    CritNum (2, this, "nrot", s_namenrot, q, sN_A);		// constrain by number of rotor cells
    CritNum (2, this, "rar", s_namerar, r, sN_A);		// constrain by rarity
    CritNum (2, this, "temp", s_nametemp, o, u);		// constrain by temperature
    CritNum (2, this, "tts", s_nametts, m, u);			// constrain by time to stabilize
    CritNum (2, this, "vol", s_namevol, o, sN_A);		// constrain by volatility
    CritNum (2, this, "svol", s_namesvol, o, sN_A);		// constrain by strict volatility
    CritNum (2, this, "rvol", s_namervol, o, sN_A);		// constrain by relative volatility
    CritNum (3, this, "hullw", s_namehullw, o, u);		// constrain by convex hull width
    CritNum (3, this, "hullh", s_namehullh, o, u);		// constrain by convex hull height
    CritNum (3, this, "hulld", s_namehulld, o, u);		// constrain by convex hull diagonal
    CritNum (3, this, "hullc", s_namehullc, o, u);		// constrain by convex hull circumference
    CritNum (3, this, "hulla", s_namehulla, o, u);		// constrain by convex hull area
    CritNum (3, this, "hulls", s_namehulls, o, u);		// constrain by convex hull squareness
    CritNum (3, this, "lboxw", s_namelboxw, o, u);		// constrain by largest box width
    CritNum (3, this, "lboxh", s_namelboxh, o, u);		// constrain by largest box height
    CritNum (3, this, "lboxd", s_namelboxd, o, u);		// constrain by largest box diagonal
    CritNum (3, this, "lboxc", s_namelboxc, o, u);		// constrain by largest box circumference
    CritNum (3, this, "lboxa", s_namelboxa, o, u);		// constrain by largest box area
    CritNum (3, this, "lboxs", s_namelboxs, o, u);		// constrain by largest box squareness
    CritNum (3, this, "boxw", s_nameboxw, true, u);		// constrain by smallest box width
    CritNum (3, this, "boxh", s_nameboxh, true, u);		// constrain by smallest box height
    CritNum (3, this, "boxd", s_nameboxd, true, u);		// constrain by smallest box diagonal
    CritNum (3, this, "boxc", s_nameboxc, true, u);		// constrain by smallest box circumference
    CritNum (3, this, "boxa", s_nameboxa, true, u);		// constrain by smallest box area
    CritNum (3, this, "boxs", s_nameboxs, true, u);		// constrain by smallest box squareness
    CritNum (3, this, "rboxw", s_namerboxw, q, sN_A);		// constrain by rotor box width
    CritNum (3, this, "rboxh", s_namerboxh, q, sN_A);		// constrain by rotor box height
    CritNum (3, this, "rboxd", s_namerboxd, q, sN_A);		// constrain by rotor box diagonal
    CritNum (3, this, "rboxc", s_namerboxc, q, sN_A);		// constrain by rotor box circumference
    CritNum (3, this, "rboxa", s_namerboxa, q, sN_A);		// constrain by rotor box area
    CritNum (3, this, "rboxs", s_namerboxs, q, sN_A);		// constrain by rotor box squareness
    for (var i = 0; i < 6; ++i) {					// Dividing lines
	ShowR ("inbar" + i, this.s_bar[i]);
    }
    if (selectb && now) {					// Image search might also allow Catagolue search:
	if (! (this.s_cats & OM_CATS)) {			// Not a catagolue-supported category
	} else if (this.s_still < 0) {				// Catagolue does not support wildards
	} else if (this.s_still > 0) {				// Catagolue can search still-lifes
	    selectb.p_cid = O_STILL;
	} else if (this.s_pers !== M_EQ) {			// No specific period: catagolue needs one
	} else if (this.s_cats & OM_VELS &&			// Spaceship
	  (! (this.s_cats & ~OM_VELS) || this.s_vels !== M_ANY &&
	  (this.s_vels !== M_EQ || this.s_velx !== 0))) {
	    selectb.p_cid = O_SS;
	    selectb.p_per = this.s_pery;
	} else if (this.s_cats & OM_STILLS &&			// Still-life
	  (! (this.s_cats & ~OM_STILLS) || this.s_pers !== M_ANY && this.s_pery === 1)) {
	    selectb.p_cid = O_STILL;
	} else if (this.s_cats & OM_OSCS &&			// Oscillator
	  (! (this.s_cats & ~OM_OSCS) || this.s_pers !== M_ANY && this.s_pery > 1)) {
	    selectb.p_cid = O_OSC;
	    selectb.p_per = this.s_pery;
	}							// Other: not supported
	Display (this.s_rules, selectb);
	Image (f, this.s_rules, null, "search");		// Display field, rather than pattern
    }
    if (s.s_cats === OM_NONE) {		// If no categories apply, this search must fail
	s.s_fail = true;
    }
}
// Search method: extract search criteria as side-effects from an apg search filename prefix
function s_ApgPref (i, s) {
    switch (i) {			// prefix
    case "s":				// xs<pop>_<code>, ov_s<pop>: Still-life
	this.s_apgcats = OM_STILLS;
	this.s_apgcat = O_STILL;
	this.s_apgper = 1;
	this.s_apgminp = parseInt (s);
	break;
    case "p":				// xp<period>_<code>, ov_p<period>: Oscillator
	this.s_apgper = parseInt (s);
	this.s_apgcats = this.s_apgper === 1 ? OM_STILLS : OM_OSCS;	// (period 1 "cannot happen")
	this.s_apgcat = this.s_apgper === 1 ? O_STILL : O_OSC;
	break;
    case "q":				// xq<period>_<code>, ov_q<period>: Spaceship
	this.s_apgper = parseInt (s);
	this.s_apgcats = OM_MOVES;
	this.s_apgcat = O_SS;
	break;
    }
}
Searches.prototype.s_ApgPref = s_ApgPref;
// Search method: extract search criteria from an apg search filename
function s_ApgName (t) {
    this.s_apgpref = t;
    var i = t.indexOf ("_");
    if (i > 0) {
	this.s_apgpref = t.substring (0, i+1);
	var s = t.substring (i+1);			// suffix
	i = t.substring (0, i);				// prefix
	this.s_apgcats = OM_NONE;
	this.s_apgcat = O_ANY;
	if (i === "ov") {				// Large repeating object
	    this.s_ApgPref (s.substring (0, 1), s.substring (1));
	    this.s_apgpref = t;
	} else if (i.substring (0, 1) === "x") {	// Repeating object
	    this.s_ApgPref (i.substring (1, 2), i.substring (2));
	} else if (i.substring (0, 2) === "yl" ||
	  t === "zz_LINEAR" || t === "zz_REPLICATOR") {	// Linearly growing pattern
	    this.s_apgcats = OM_LINEAR;
	    this.s_apgcat = O_PUFF;
	    this.s_apgpref = t;
	} else if (t === "zz_QUADRATIC") {		// Quadratically growing pattern
	    this.s_apgcats = OM_BR;
	    this.s_apgcat = O_BR;
	    this.s_apgpref = t;
	} else if (t === "zz_EXPLODING" || t === "PATHOLOGICAL") {	// Unknown growth
	    this.s_apgcats = OM_METH;
	    this.s_apgcat = O_METH;
	    this.s_apgpref = t;
	}
    }
}
Searches.prototype.s_ApgName = s_ApgName;
//------------------------------ User-activated functions ----------------------
// Set background color on all cells in a table row; gliders colored differently
function SetRowBg (tr, bg, bgi, g, pop, r, p) {
    var n = (tr = GetCells (tr)).length;
    for (var i = 0; i < n; ++i) {
	var b = i === glidercol ? GlColors (g, pop, bg) : bg;
	SetBg (tr[i], b);
	if (i === nviscol-1 && viscol[S_IMG]) {
	    var c = tr[i].getElementsByTagName ("canvas");
	    if (c.length) {
		DrawThumb (c[0], r, p, b, bgi);
	    }
	}
    }
}
// Set sort direction, based on column clicked on
function Column (col, dir) {
    ReTime ();				// Reset tool-tip timer
    defsort1 = col;
    sortdir1 = dir;
    nosort = true;			// Update controls WITHOUT two automatic sorts
    SetSel ("insort1s", sortcols[col]);
    SetSel ("indir1s", dir < 0);
    nosort = false;
    Sort (true, 0);
}
// Select specific solution, based on rule, and index into list box for that rule
function Found (r, i, url, target) {
    ReTime ();				// Reset tool-tip timer
    var x = rulefirst[r] + i;		// Index into list table
    if (selecti >= 0) {			// Un-hilight previous selection
	SetRowBg (GetRows ("tablist")[selecti], C_BG, C_bg, selectb.p_gls, selectb.p_minp, r, selectb);
    }
    var p = results[r][i];		// Highlight newly-selected item
    SetRowBg (GetRows ("tablist")[selecti = x], C_ROW_SEL, C_row_sel, p.p_gls, p.p_minp, r, p);
    Display (r, p);
    Image (null, r, p, p.p_GetFile ());
    if(url) {
	if (url[0] === "~") {		// Synthesize LIS in another window
	    OpenPre ("lifesrch_lis", target, url.substr (1));
	} else {			// Open related page in another window
	    open (url, target || "_blank");
	}
    }
}
// Toggle expanding/collapsing of a rule's results within result list
// This is useful when one rule has more than (maxlist) matches,
// which suppresses results from other rule(s)
function Collapse (r) {
    ReTime ();				// Reset tool-tip timer
    expanded[r] ^= 1;
    Sort (false, pageno);
}
// Open stamp image itself as a png image
function NavPng () {
    var w = open ("", "lifesrch_png");
    if (w) {
	w.document.open ();
	w.document.write ("<html><head><title>" + sSearch_Results +
	  "<\/title><\/head><body><img width=\"" + stampr + " height=\"" + stampb +
	  " src=\"" + Id ("canstamp").toDataURL () + "\" /><\/body><\/html><\/pre>");
	w.document.close ();
    }
}
// Display stamp page itself as the pattern
function NavRle () {
    Deselect ();
    Sort (false, pageno);			// Re-display current page
    stampq.p_img = Bin2Lib (stampf, 0, 1, stampf.f_wid, stampf.f_wid, stampf.f_hgt, false);
    stampq.p_comm = AddComment (sSearch_results) + srch.s_comm;
    if (nfound > 1) {				// 1 item needs no sort order
	var c = ssort_by + " " +
	  (sortdir1 > 0 ? sascending : sdescending) + " " + sortnames[defsort1];
	if (defsort2 !== defsort1) {
	    c += ", " + (sortdir2 > 0 ? sascending : sdescending) + " " + sortnames[defsort2];
	}
	if (defsort1 !== S_MINP && defsort2 !== S_MINP) {
	    c += ", " + sortnames[S_MINP];
	}
	if (defsort1 !== S_PER && defsort2 !== S_PER) {
	    c += ", " + sortnames[S_PER];
	}
	if (defsort1 !== S_BOXH && defsort2 !== S_BOXH) {
	    c += ", " + sortnames[S_BOXH];
	}
	if (defsort1 !== S_BOXW && defsort2 !== S_BOXW) {
	    c += ", " + sortnames[S_BOXW];
	}
	if (defsort1 !== S_IMG && defsort2 !== S_IMG) {
	    c += ", " + sortnames[S_IMG];
	}
	c = c.replace (/, /g, ", " + sthen + " ");
	if (npages > 1) {			// 1 page needs no page number
	    c += " (" + spage + " " + (pageno+1) + " / " + npages + ")";
	}
	stampq.p_comm += AddComment (c);
    }
    Display (stamprule, stampq);
    Image (null, stamprule, stampq, "stamp");
}
// Open a list of strings for all results in new text window
function NavAll (f, target, t) {
    var s = "";
    for (var r = 0; r < R_MAX; ++r) {
	for (var i = 0; i < nresults[r]; ++i) {
	    var j = f (results[r][i], r);
	    if (j && j.length) {
		s += j + "\n";
	    }
	}
    }
    OpenPre (target, t, s);
}
// Open list of APG strings for all results in a new text window
function NavApg () {
    NavAll (EachApg, "lifesrch_apg", sSearch_Results_As_APG);
}
function EachApg (p, r) {
    return p.p_GetApg (r);
}
// Open list of LIS strings for all results in a new text window
function NavLis () {
    NavAll (EachLis, "lifesrch_lis", sSearch_Results_As_LIS);
}
function EachLis (p, r) {
    return p.p_GetLis (r);
}
// Open list of SOF strings for all results in a new text window
function NavSof () {
    NavAll (EachSof, "lifesrch_sof", sSearch_Results_As_SOF);
}
function EachSof (p, r) {
    return p.p_GetSof (r);
}
// Open list of HRD strings for all results in a new text window
function NavHrd () {
    NavAll (EachHrd, "lifesrch_hrd", sSearch_Results_As_HRD);
}
function EachHrd (p, r) {
    return p.p_GetHrd (r);
}
// Create ZIP file of all patterns (TBD!)
function NavZip () {
    alert (stbdzip);
}
// Launch text list in a new window
function OpenPre (target, t, s) {
    var w = open ("", target);
    if (w) {
	w.document.open ();
	w.document.write ("<html><head><title>" + t +
	  "<\/title><\/head><body><pre>" + s + "<\/pre><\/body><\/html>");
	w.document.close ();
    }
}
// Launch a LIS image into another window
function Lis () {
    OpenPre ("lifesrch_lis", selectb.p_GetFile (), selectb.p_GetLis ());
}
// Add current pattern's HRD description to search criteria and re-search
function AddHrd () {
    SetChecked ("inhrde", 1);
    SetSel ("inhrds", 1);
    SetValue ("inhrdt", selectb.p_GetHrd ());
    Criteria (1);
    Search ();
}
// Launch a pattern from memory directly, when an external RLE file is not available
function Pseudo () {
    var f = selectb.p_GetFile ();
    var s = selectb.p_GetNames ();
    var t = (f.length ? f + ": " : "") + (s.length ? s + ": ": "") + sPattern;
    s = "#N " + t + "\n";
    s += "#O " + soline + ", " + new Date ().toUTCString () + "\n";
    if (selectb.p_boxw <= 66) {
	f = Convert (null, null, null, selectr, selectb, X_CELLS,
	  1, 1, 0, 0, 0, "");
	s += ("\n" + f.substring (0, f.length-1)).replace(/\n/g, "\n#C  ").substring (1) + "\n";
    }
    s += Convert (null, null, null, selectr, selectb, X_RLE, 1, 1, 0, 0, 0, "");
    OpenPre ("lifesrch_rle", t, s);
}
// Click on pattern image to open the pattern
function Launch () {
    if (selectb) {			// File exists: open it
	var file = selectb.p_GetFile ();
	if (file) {
	    open (LocalFile (selectr, selectb.p_GetDir (rulelib[selectr][selectb.p_hid].h_sub), file), "lifesrch_rle");
	} else {			// File does not exist: fake it
	    Pseudo ();
	}
    }
}
// Determine page region, depending on mouse position
function Region (event) {
    var xy = MouseRel (event);
    var x = xy[0];
    var y = xy[1];
    if (y < 10) {
	if (x < 10) {			// Top left: Page up
	    return E_PGUP;
	} else if (x >= stampr-10) {	// Top right: download Zip file
	    return E_ZIP;
	}
    } else if (y >= stampb-10) {
	if (x < 10) {			// Bottom left: Page down
	    return E_PGDN;
	} else if (x >= stampr-10) {	// Bottom right: download stamp RLE file
	    return E_STAMP;
	}
    }
    x = max (0, min (stampx-1, floor ((x-8)/stampw/stampm)));
    y = max (0, min (stampy-1, floor ((y-4)/stamph/stampm)));
    if ((x += y * stampx) >= stampn) {		// Ignore space beyond last image
	return E_NONE;
    }
    return x;
}
// Click on stamp image
function Click (event) {
    ReTime ();
    var x = Region (event);
    switch (x) {
    case E_NONE:			// Invalid area: do nothing
	break;
    case E_PGUP:			// Top left: Page up
	PgUp ();
	break;
    case E_ZIP:				// Top right: download Zip file
	NavZip ();
	break;
    case E_PGDN:			// Bottom left: Page down
	PgDn ();
	break;
    case E_STAMP:			// Bottom right: download stamp RLE file
	NavRle ();
	break;
    default:				// Valid image
	SortStamp (pageno, x, true);
	break;
    }
}
// Hover over a stamp image
function StampOver (event) {
    ReTime ();
    var x = Region (event);
    switch (x) {
    case E_NONE:			// Invalid area: do nothing
	x = "";
	break;
    case E_PGUP:			// Top left: Page up
	x = sPage_up;
	break;
    case E_ZIP:				// Top right: download Zip file
	x = sZip_archive;
	break;
    case E_PGDN:			// Bottom left: Page down
	x = sPage_down;
	break;
    case E_STAMP:			// Bottom right: download stamp RLE file
	x = sThis_stamp_page;
	break;
    default:				// Valid image
	x = SortStamp (pageno, x, false);
	break;
    }
    var p = Id ("canstamp");
    p.title = p.alt = x;
}
// Start tip-timer
function TimerOn () {
    tiptimer = setTimeout ("Tip()", TIPTIME*1000);
}
// Shut tip-timer off
function TimerOff () {
    if (tiptimer) {
	clearTimeout (tiptimer);
	tiptimer = null;
    }
}
// User has clicked on something
function ReTime () {
    if (tipshown) {		// If tool-tip is shown, hide it
	Out ();
    } else if (tiptimer) {	// If timer is pending, restart it
	TimerOff ();
	TimerOn ();
    }
}
// Mouse leaves area of tool-tip
function Out () {
    TimerOff ();		// Cancel tip-timer, if active
    if (tipname) {
	ShowB ("tooltip", false);
	ShowB (tipname, tipshown = false);
    }
    tipname = "";
}
// Draw tool-tip
function Tip () {
    clearTimeout (tiptimer);
    tiptimer = null;
    ShowB (tipname, tipshown = true);
    ShowB ("tooltip", true);
}
// Mouse enters area over a control; prepare to draw tool-tip eventually
function Over (event, n) {
    var ok = tok[n];
    if (ok === false || !GetChecked ("intipe")) {	// Suppress tips on suppressed elements
	return;				// or if tool tips are globally disabled
    }					// (But ok === undefined is ALLOWED)
    n = "tip" + n;
    if (tipname !== n) {		// If changed tips, cancel previous one
	Out ();
    }
    tipname = n;
    if (!tipshown && !tiptimer) {	// Start timer to eventually draw tip
	FitObj ("tooltip", MouseAbs (event));
	TimerOn ();			// Start tip-timer
    }
}
// Reset button pressed: clear text and rule selection
function Clear () {
    ReTime ();				// Reset tool-tip timer
    Reset ("inform");			// Reset physical HTML form
    ReInit (-1);			// Re-initialize form-related state
}
// Export button pressed: save pattern in user-selected format
function Export () {
    ReTime ();				// Reset tool-tip timer
    if (selectb) {
	var fmt = EvalSel ("inexports");
	if (fmt === X_APG) {		// apg search: export the name
	    Enter (selectb.p_GetApg (selectr));
	} else if (fmt === X_LIS) {	// LIS string: export the string
	    Enter (selectb.p_GetLis (selectr));
	} else if (fmt === X_SOF) {	// SOF name: export the name
	    Enter (selectb.p_GetSof (selectr));
	} else {			// All others: export the image
	    Enter (Convert (null, null, null, selectr, selectb, fmt,
	      1, 1, 0, 0, 0, selectb.p_GetComm ()));
	}
    }
}
// Save button pressed: save search parameters in text format
function Save () {
    srch = new Searches (false);	// Get most up-to-date search parameters
    saves.push ("view=" + viewenum[EvalSel ("inviews")]);
    saves.push ("tip=" + (0 + GetChecked ("intipe")));
    saves.push ("num=" + numenum[EvalSel ("innums")]);
    saves.push ("dec=" + encodeURIComponent (GetValue ("indect")));
    saves.push ("max=" + encodeURIComponent (GetValue ("inmaxt")));
    saves.push ("sort1=" + (EvalSel ("indir1s") ? "-" : "") + sortenum[EvalSel ("insort1s")]);
    saves.push ("sort2=" + (EvalSel ("indir2s") ? "-" : "") + sortenum[EvalSel ("insort2s")]);
    saves.push ("export=" + expenum[EvalSel ("inexports") + 1]);
    saves.push ("ctype=" + typeenum[EvalSel ("cattypes")]);
    saves.push ("chaul=" + GetValue ("cathauls"));
    saves.push ("cname=" + encodeURIComponent (GetValue ("catnamet")));
    saves.push ("cobj=" + GetValue ("catobjs") + encodeURIComponent (GetValue ("catrulet")));
    saves.push ("crule=" + ((i = GetValue ("catrules")) === "?" ? encodeURIComponent (GetValue ("catrulet")) : i));
    saves.push ("csymm=" + ((i = GetValue ("catsymms")) === "?" ? encodeURIComponent (GetValue ("catsymmt")) : i));
    saves.push ("cdate=" + GetValue ("catyys") + GetValue ("catmms") + GetValue ("catdds"));
    saves.push ("ccat=" + catenum[EvalSel ("catcats")]);
    saves.push ("cpop=" + encodeURIComponent (GetValue ("catpopt")));
    saves.push ("cosc=" + encodeURIComponent (GetValue ("catosct")));
    saves.push ("css=" + encodeURIComponent (GetValue ("catsst")));
    saves.push ("cpuff=" + encodeURIComponent (GetValue ("catpufft")));
    saves.push ("cgun=" + encodeURIComponent (GetValue ("catgunt")));
    saves.push ("still=" + pop + (parseInt (GetValue ("stilhards")) ? "#" : ".") + encodeURIComponent (GetValue ("stilnum")));
    saves.push ("rrule=" + encodeURIComponent (GetValue ("rule")));
    var s = "";				// Accumulated parameters
    for (var i = 0; i < saves.length; ++i) {
	s += "&" + saves[i];
    }
    var u = "" + window.location;	// Base URL of page
    Enter (((i = u.indexOf ("?")) < 0 ? u :
      u.substring (0, i)) + "?" + s.substring (1));
}
// Dynamically-called functions to load particular parameters
// These are called by name. Invalid names will throw an exception.
// Invalid parameters may throw an exception.
// All exceptions are ignored, so invalid command-line parameters are effectively ignored.
function LOAD_apg (s) { LoadName ("apg", s); }				// apgsearch name
function LOAD_file (s) { LoadName ("file", s); }			// File name
function LOAD_hdr (s) { LoadName ("hdr", s); }				// Header name
function LOAD_hrd (s) { LoadName ("hrd", s); }				// HRD
function LOAD_nbr (s) { LoadName ("nbr", s); }				// Neighborhood name
function LOAD_pat (s) { LoadName ("pat", s); }				// Pattern name
function LOAD_sof (s) { LoadName ("sof", s); }				// SOF name
function LOAD_lis (s) { LoadName ("lis", s); }				// LIS name
function LOAD_wiki (s) { LoadName ("wiki", s); }			// Wiki name
function LOAD_diff (s) { LoadChecked ("diff", s); }			// Difficult search
function LOAD_exp (s) { if (everexp) LoadChecked ("exp", s); }		// Expanded search
function LOAD_multin (s) { LoadChecked ("multin", s); }			// Multiple names
function LOAD_multif (s) { LoadChecked ("multif", s); }			// Multiple filefs
function LOAD_multic (s) { LoadChecked ("multic", s); }			// Multi-colored life
function LOAD_wiki (s) { LoadChecked ("wiki", s); }			// Has Lifewiki entry?
function LOAD_cat (s) {							// Category(ies)
    for (var i = 0, c = 0; i < s.length; ++i) {
	var j = catenum.indexOf (s[i]);
	if (j >= 0) {
	    c |= 1 << j;
	}
    }
    c = s === "*" ? OM_ALL : c;
    LoadSel ("cat", !c || c !== OM_ALL && (c & c-1) ? OM_MULTI : c, 1);
    CatMany (c);
}
function LOAD_ff (s) { LoadSel ("ff", ffenum.indexOf (s), 1); }		// Period 2 type
function LOAD_river (s) { LoadSel ("river", rrenum.indexOf (s), 1); }	// River type
function LOAD_rot (s) { LoadSel ("rot", rotenum.indexOf (s), 1); }	// Rotor type
function LOAD_rule (s) { LoadSel ("rule", window["R_" + s], 1); }	// Rule	(but skip TOTAL?!)
function LOAD_phx (s) { LoadSel ("phx", phxenum.indexOf (s), 1); }	// Phoenix type
function LOAD_symm (s) { LoadSel ("symm", window["Y_" + s], 1); }	// Symmetry type
function LOAD_glide (s) { LoadSel ("glide", window["Y_" + s], 1); }	// Glide symmetry type
function LOAD_parity (s) { LoadSel ("pars", parseInt (s), 1); }		// Symmetry parity
function LOAD_hullw (s) { LoadNum ("hullw", s); }			// Hull width
function LOAD_hullh (s) { LoadNum ("hullh", s); }			// Hull height
function LOAD_hulld (s) { LoadNum ("hulld", s); }			// Hull diagonal
function LOAD_hullc (s) { LoadNum ("hullc", s); }			// Hull circumference
function LOAD_hulla (s) { LoadNum ("hulla", s); }			// Hull area
function LOAD_hulls (s) { LoadNum ("hulls", s); }			// Hull squareness
function LOAD_lboxw (s) { LoadNum ("lboxw", s); }			// Largest box width
function LOAD_lboxh (s) { LoadNum ("lboxh", s); }			// Largest box height
function LOAD_lboxd (s) { LoadNum ("lboxd", s); }			// Largest box diagonal
function LOAD_lboxc (s) { LoadNum ("lboxc", s); }			// Largest box circumference
function LOAD_lboxa (s) { LoadNum ("lboxa", s); }			// Largest box area
function LOAD_lboxs (s) { LoadNum ("lboxs", s); }			// Largest box squareness
function LOAD_boxw (s) { LoadNum ("boxw", s); }				// Minimum box width
function LOAD_boxh (s) { LoadNum ("boxh", s); }				// Minimum box height
function LOAD_boxd (s) { LoadNum ("boxd", s); }				// Minimum box diagonal
function LOAD_boxc (s) { LoadNum ("boxc", s); }				// Minimum box circumference
function LOAD_boxa (s) { LoadNum ("boxa", s); }				// Minimum box area
function LOAD_boxs (s) { LoadNum ("boxs", s); }				// Minimum box squareness
function LOAD_rboxw (s) { LoadNum ("rboxw", s); }			// Rotor box width
function LOAD_rboxh (s) { LoadNum ("rboxh", s); }			// Rotor box height
function LOAD_rboxd (s) { LoadNum ("rboxd", s); }			// Rotor box diagonal
function LOAD_rboxc (s) { LoadNum ("rboxc", s); }			// Rotor box circumference
function LOAD_rboxa (s) { LoadNum ("rboxa", s); }			// Rotor box area
function LOAD_rboxs (s) { LoadNum ("rboxs", s); }			// Rotor box squareness
function LOAD_act (s) { LoadNum ("act", s); }				// Active rotor cells
function LOAD_nrot (s) { LoadNum ("nrot", s); }				// Number of rotors
function LOAD_gls (s) { LoadNum ("gls", s); }				// Gliders
function LOAD_rgls (s) { LoadNum ("rgls", s); }				// Relative gliders
function LOAD_glna (s) { LoadNum ("glna", s); }				// Glider number (all)
function LOAD_glnr (s) { LoadNum ("glnr", s); }				// Glider number (rule)
function LOAD_mod (s) { LoadNum ("mod", s); }				// Modulus
function LOAD_rmod (s) { LoadSel ("rmod", parseInt (s)); }		// Relative modulus
function LOAD_per (s) { LoadNum ("per", s); }				// Period
function LOAD_avgp (s) { LoadNum ("avgp", s); }				// Average population
function LOAD_maxp (s) { LoadNum ("maxp", s); }				// Maximum population
function LOAD_minp (s) { LoadNum ("minp", s); }				// Minimum population
function LOAD_rpop (s) { LoadNum ("rpop", s); }				// Relative population
function LOAD_vel (s) { LoadNum ("vel", s); }				// Velocity
function LOAD_dir (s) { LoadSel ("velo", direnum.indexOf (s)); }	// Direction
function LOAD_mden (s) { LoadNum ("mden", s); }				// Maximum density
function LOAD_aden (s) { LoadNum ("aden", s); }				// Average density
function LOAD_den (s) { LoadNum ("den", s); }				// Density
function LOAD_ef (s) { LoadNum ("ef", s); }				// Evolution factor
function LOAD_freq (s) { LoadNum ("freq", s); }				// Frequency
function LOAD_heat (s) { LoadNum ("heat", s); }				// Heat
function LOAD_inf (s) { LoadNum ("inf", s); }				// Influence
function LOAD_rar (s) { LoadNum ("rar", s); }				// Rarity
function LOAD_temp (s) { LoadNum ("temp", s); }				// Temperature
function LOAD_tts (s) { LoadNum ("tts", s); }				// Time to stabilize
function LOAD_vol (s) { LoadNum ("vol", s); }				// Volatility
function LOAD_svol (s) { LoadNum ("svol", s); }				// Strict volatility
function LOAD_rvol (s) { LoadNum ("rvol", s); }				// Relative volatility
function LOAD_imgh (s) {						// Image control height
    SetRows ("inimgt", s = max (2, min (1000, parseInt (s) || 0)));
    SetText ("imimgh", "" + s);
}
function LOAD_image (s) { SetValue ("inmulti", s); }			// Pattern image
function LOAD_nbr (s) { SetValue ("innbrt", s); }			// Neighborhood
function LOAD_view (s) { LoadSel ("view", viewenum.indexOf (s)); }	// View type
function LOAD_tip (s) { SetChecked ("intipe", parseInt (s)); }		// Tool tips
function LOAD_num (s) { LoadSel ("num", numenum.indexOf (s));	 }	// Number format
function LOAD_dec (s) { SetValue ("indect", s); }			// Decimal digits
function LOAD_max (s) { SetValue ("inmaxt", s); }			// Maximum results
function LOAD_exp (s) { LoadSel ("exports", expenum.indxOf (s)-1, ""); }	// Export format
function LOAD_sort1 (s) { LoadSort (1, s); }				// Sort 1 direction and order
function LOAD_sort2 (s) { LoadSort (2, s); }				// Sort 1 direction and order
function LoadSort (i, s) {						// Sort direction and order
    var n = s[0] === "-";
    LoadSel ("dir"+i, n);
    LoadSel ("sort"+i, window["S_" + s]);
}
function LOAD_ctype (s) { LoadSel ("cattypes", typeenum.indexOf (s)); }		// Catagolue type
function LOAD_chaul (s) { LoadSel ("cathauls", parseInt (s)); }			// Catagolue haul type
function LOAD_cname (s) { SetValue ("catnamet", s); }				// Catagolue user name
function LOAD_cobj (s) { LoadSel ("catobjs", parsInt (s.substring (0, 1))); SetValue ("catobjt", s.substring (1)); }	// Catagolue APG code
function LOAD_crule (s) { SetValue ("catrulet", s); LoadSel ("catrules", "?"); SetValue ("catrules", s); }	// Catagolue rule
function LOAD_csymm (s) { SetValue ("catsymmt", s); SetValue ("catsymms", "?"); SetValue ("catsymms", s); }	// Catagolue symmetry
function LOAD_cdate (s) { s = parseInt (s); LoadSel ("catdds", s%100); LoadSel ("catmms", floor (s/100%100)); LoadSel ("catyys", floor (s/10000)); }	// Catalogue date
function LOAD_ccat (s) { LoadSel ("catcats", catenum.indexOf (s)); }		// Catagolue category
function LOAD_cpop (s) { SetValue ("catpopt", s); }				// Catagolue still population
function LOAD_cosc (s) { SetValue ("catosct", s); }				// Catagolue oscillator period
function LOAD_css (s) { SetValue ("catsst", s); }				// Catagolue spaceship period
function LOAD_cpuff (s) { SetValue ("catpufft", s); }				// Catagolue puffer modulus
function LOAD_cgun (s) { SetValue ("catgunt", s); }				// Catagolue gun modulus
function LOAD_still (s) {							// Still life search
    var d = s.indexOf (".");
    var n = s.indexOf ("#");
    SetSel ("stilpops", parseInt (s) - 4);
    LoadSel ("stilhards", n > d);
    SetValue ("stilnum", s.substring (max (d, n) +1));
}
function LOAD_rrule (s) { SetValue ("rule", s); RuleParse (); }			// Rule name
// Automatically search for a specific stamp, launched from that stamp's navigation bar
function LOAD_auto (s, n) {
    autorun = true;
    if (s.length) {
	LOAD_view ("s");
    }
    var f = window["AUTO_" + s.replace (/-/g, "_")];
    if (f) {
	return f (s, n);
    }
    if ((i = s.indexOf ("-")) >= 0) {
	return LOAD_auto (s.substring (0, i), n), LOAD_auto (s.substring (i+1), n+1);
    } else if (s[s.length-1] === "d" &&
      (i = parseInt (f = s.substring (0, s.length-1)), f == i)) {
	return AUTON_ (i, n), LOAD_diff ("1");
    } else {
	for (var j = 0; j < 3; ++j) {
	    var p = s.substring (j);
	    f = window["AUTON_" + s.substring (0, j)];
	    var i = parseInt (p);
	    if (p == i) {
		return f (i, n);
	    }
	}
    }
}
function AUTO_p1_35 (s) { AUTO_p1 (); LOAD_minp (LG+"i39"); }	// p1-35: still-lifes 35-39 bits
function AUTO_p1_lg (s) { AUTO_p1 (); LOAD_minp ("u40"); }	// p1-lg: still-lifes 40+ bits
function AUTO_p2_sc (s) { AUTO_p (2); LOAD_minp ("u28"); }	// p2-sc: scrubbers (approximately)
function AUTO_p15_pc (s) { LOAD_cat ("oO"); LOAD_per ("e15"); LOAD_minp ("u24"); }	// p15-pc: pentadecathlon pairs (approximately)
function AUTO_ss_2 (s) { LOAD_HDR (s); }			// ss-2: 2-spaceship flotillae
function AUTO_ss_2a (s) { LOAD_HDR (s); }			// ss-2a: 2-spaceship A-draggers
function AUTO_ss_2d (s) { LOAD_HDR (s); }			// ss-2d: 2-spaceship draggers
function AUTO_ss_2s (s) { LOAD_HDR (s); }			// ss-2s: 2-spaceship Shick ships
function AUTO_ss_3 (s) { LOAD_HDR (s); }			// ss-3: 3-spaceship flotillae
function AUTO_ss_3d (s) { LOAD_HDR (s); }			// ss-3a: 3-spaceship block draggers
function AUTO_ss_3p (s) { LOAD_HDR (s); }			// ss-3p: 3-spaceship pre-block draggers
function AUTO_ss_4 (s) { LOAD_HDR (s); }			// ss-4: 4-spaceship flotillae
function AUTO_ss_4c (s) { LOAD_HDR (s); }			// ss-4c: 4-spaceship comma draggers
function AUTO_ss_4h (s) { LOAD_HDR (s); }			// ss-4h: 4-spaceship hive nudgers
function AUTO_c (s) { LOAD_multic ("1"); }			// c-: multi-color version
function AUTO_22 (s, q) { q ? AUTON_ (22) : LOAD_rule ("B2S2"); }	// 22-: 2/2 Life; -22: population=22
function AUTO_34 (s, q) { q ? AUTON_ (34) : LOAD_rule ("B34S34"); }	// 34-: 3/4 Life; -34: population=34
function AUTO_36 (s, q) { q ? AUTON_ (36) : LOAD_rule ("B36S36"); }	// 36-: HighLife; -36: population=36 (not used yet)
function AUTO_rr (s) { LOAD_rule ("B36S245"); }			// rr-: Replicator rule
function AUTO_8l (s) { LOAD_rule ("B3S238"); }			// 8l-: EightLife
function AUTO_pl (s) { LOAD_rule ("B38S23"); }			// pl-: Pedestrian Life
function AUTO_hl (s) { LOAD_rule ("B38S238"); }			// hl-: Honey Life
function AUTO_n0 (s) { LOAD_rule ("NIEMIEC0"); }		// n0-: Niemiec's rule 0
function AUTO_n1 (s) { LOAD_rule ("NIEMIEC1"); }		// n1-: Niemiec's rule 1
function AUTO_n2 (s) { LOAD_rule ("NIEMIEC2"); }		// n2-: Niemiec's rule 2
function AUTO_n4 (s) { LOAD_rule ("NIEMIEC4"); }		// n4-: Niemiec's rule 4
function AUTO_n5 (s) { LOAD_rule ("NIEMIEC5"); }		// n5-: Niemiec's rule 5
function AUTO_lg (s) { LOAD_minp ("u"+LG); }			// -lg: population 35+
function AUTO_g8 (s) { LOAD_gls ("u8"); }			// g8: 8+ gliders
function AUTO_ge (s) { LOAD_gls ("a"); LOAD_rgls ("e1"); }	// ge: 1 glider/bit
function AUTO_gg (s) { LOAD_gls ("a"); LOAD_rgls ("g1"); }	// gg: >1 glider/bit
function AUTO_gx (s) { LOAD_gls ("100i1000000"); }		// gx: expensive: 100+ gliders
function AUTO_gp (s) { LOAD_gls ("p"); }			// gp: partial
function AUTO_gu (s) { LOAD_gls ("x"); }			// gu: unknown
function AUTO_p1 (s) { LOAD_cat ("s"); }			// p1: pseudo-still-life
function AUTO_pp1 (s) { LOAD_cat ("S"); }			// pp1: pseudo-still-life
function AUTO_qp1 (s) { LOAD_cat ("C"); }			// qp1: quasi-still-life
function AUTO_osc (s) { LOAD_cat ("o"); }			// osc: oscillator
function AUTO_posc (s) { LOAD_cat ("O"); }			// posc: pseudo-oscillator
function AUTO_qosc (s) { LOAD_cat ("k"); }			// qosc: quasi-oscillator
function AUTO_ss (s) { LOAD_cat ("q"); }			// ss: spaceship
function AUTO_pss (s) { LOAD_cat ("Q"); }			// pss: pseudo-spaceship
function AUTO_qss (s) { LOAD_cat ("K"); }			// qss: quasi-spaceship
function AUTO_ws (s) { LOAD_cat ("w"); }			// ws: wick-stretcher
function AUTO_puff (s) { LOAD_cat ("p"); }			// puff: puffer
function AUTO_gun (s) { LOAD_cat ("g"); }			// gun: gun
function AUTO_br (s) { LOAD_cat ("b"); }			// br: breeder
function AUTO_cons (s) { LOAD_cat ("c"); }			// cons: constellation
function AUTO_meth (s) { LOAD_cat ("m"); }			// br: breeder
//function AUTO_obj (s) { }					// obj: object
//function AUTO_all (s) { }					// all: all collisions
function AUTO_com (s) { LOAD_freq ("g0"); }			// nat: common object
function AUTON_ (n) { LOAD_minp ("e"+n); }			// -n: population n
function AUTON_g (n) { LOAD_gls ("e"+n); }			// gn: n gliders
function AUTON_p (n) { LOAD_cat ("o"); LOAD_per ("e"+n); }	// pn: period n oscillator
function AUTON_pp (n) { LOAD_cat ("O"); LOAD_per ("e"+n); }	// ppn: period n pseudo-oscillator
function AUTON_qp (n) { LOAD_cat ("k"); LOAD_per ("e"+n); }	// qpn: period n quasi-oscillator
function AUTON_o (n) { LOAD_dir ("o"); LOAD_vel ("e1/"+n); }	// on: orthogonal velocity c/n
function AUTON_2o (n) { LOAD_dir ("o"); LOAD_vel ("e2/"+n); }	// 2on: orthogonal velocity 2c/n
function AUTON_3o (n) { LOAD_dir ("o"); LOAD_vel ("e3/"+n); }	// 3on: orthogonal velocity 3c/n
function AUTON_d (n) { LOAD_dir ("d"); LOAD_vel ("e1/"+n); }	// dn: diagonal velocity c/n
function AUTON_k (n) { LOAD_dir ("k"); LOAD_vel ("e1/"+n); }	// kn: oblique velocity c/n
// Load form values based on a saved string of the form:
// "url?param1=value1&param2=value2&...&paramn=valuen", where "paramn=valuen" is escaped.
function Loads (s) {
    Reset ("inform");			// Reset all form values to their default values
    var j = s.indexOf ("?");
    s = j < 0 ? [] : s.substring (j+1).split ("&");
    for (var i = 0; i < s.length; ++i) {
	var p = decodeURIComponent (s[i]);
	j = p.indexOf ("=");
	j = j < 0 ? p.length : j;
	var f = window["LOAD_" + p.substring (0, j)];
	if (f) {
	    f (p.substring (j+1), 0);
	}
    }
    CatBox ();
    RuleParse ();
}
// Load button pressed: load search parameters from text string
function Load () {
    Loads (GetValue ("inexported"));
}
// Help button pressed: launch help page in a separate window
function Help () {
    ReTime ();				// Reset tool-tip timer
    open (url_help, "srchhelp");	// Open help page in new window
}
// Catch keydown events; launch Help on F1
function KeyDown (e) {
    e = e || window.event;
    if (e.keyCode === 112) {
	Help ();
    }
}
// Accomodate fields to window size
function Resize () {
    aperture = GetAperture ();				// Window size
    if (imaged) {					// Maybe need to re-size canvas
	Image (imaged[0], imaged[1], imaged[2], imaged[3]);
    }
}
// Extract glider synthesis cost from Catalogue page text
function GetCSynth (s) {
alert ("GetCSynth " + s);
    let i = s.indexOf ("#CSYNTH ");			// BUG: This can be subverted by user comments
    if (i < 0) { return 0; }
    s = s.substring (i);
    i = s.indexOf (" costs ");
    if (i < 0) { return 0; }
    s = s.substring (i);
    i = parseInt (s);
    return i || 0;
}
// Attempt to extract glider synthesis cost from Catagolue page
function CSynth () {
    if (!selectb) { alert ("CSynth: no rule/pattern! "); return; }
    let url = selectb.p_GetGol (selectr);
    if (!url) { alert ("CSynth: no URL!"); return; }
    let file = new File (url);
alert ("file = " + file);
    let reader = new FileReader();
    reader.onload = (e) => { alert ("Catagolue gliders = " + GetCsynth (e.target.result)); }
    reader.onerror = (e) => { alert("Catagolue error: " + e.target.error.name); }
let i = reader.readAsText (file);
alert ("Reader started: " + i);
}
// Deselect current selection, if any
function Deselect () {
    selectb = null;			// Invalidate previous selection
    selecti = -1;
    ShowB ("viewexport", false);	// Can't export anything
}
// Search button pressed: read pattern and search for it
function Search () {
    pageno = 0;				// Stamp view will start on first page
    Deselect ();			// Deselect current selection, if any
    SetText ("txtstatus", sSearching + Uhellip);
    View (Z_SEARCH);			// Searching...
    srch = new Searches (true);		// Make sure we use the right type
    SelSort (0);			// Normalize sort direction
    TruncOptions ("inpages", 0);	// Clean out previous page lists
    TruncOptions ("inpages2", 0);
    for (var i = 0; i < R_MAX; ++i) {	// Expand all rules at start
	expanded[i] = 1;
    }
    if (srch.s_fail) {			// Ignore toxic criteria
	View (Z_NONE);			// No patterns possible!
	SetText ("txtstatus", sNotPossible);
    } else {				// Search for pattern
	Lookup ();
    }
}
// Select search criteria, after cloning symmetry parity to glide symmetry parity
function CriteriaS () {
    SetSel ("inpargs", GetSel ("inpars"));
    Criteria ();
}
// Select search criteria, after cloning glide symmetry parity to symmetry parity
function CriteriaG () {
    SetSel ("inpars", GetSel ("inpargs"));
    Criteria ();
}
// Select search criteria
function Criteria (re) {
    ReTime ();				// Reset tool-tip timer
    srch = new Searches (false);	// Read current search criteria
    if (re) {				// Optionally, redraw search results
	SelView (0);
    }
}
// Add a search constraint, based on a selection from a dropdown list
function AddCon (n) {
   var i = GetValue ("incons"+n);
   SetSel ("incons"+n, 0);
   if (i.length) {
	SetChecked ("in"+i+"e", !GetChecked ("in"+i+"e"));
	Criteria (1);
   }
}
// Select viewing criteria
// fn: -1=read criteria; 0=re-sort; 1=re-sort and reset
function SelView (fn) {
    if (nosort) {				// Auto-sort suppressed by Column ()?
	return;
    }
    ReTime ();					// Reset tool-tip timer
    var i = EvalSel ("inviews");		// View
    if (i !== view) {
	pagesize = 0;
    }
    view = i;
    i = view === V_LIST;
    ShowI ("inmaxv", i);
    ShowI ("inzoomv", !i);
    ShowB ("viewmaxh", i);
    ShowB ("viewzoomh", !i);
    i = EvalSel ("inzooms");			// Stamp zoom factor
    if (i !== stampm) {
	pagesize = 0;
    }
    stampm = i;
    maxlist = max (2, round (ParseLfloat (GetValue ("inmaxt")), NaN));	// Max list results
    if (isNaN (maxlist)) {
	maxlist = MAXLIST;
    }
    var d = decdigits;				// Previous decimal digits
    decdigits = max (1, min (20, round (ParseLfloat (GetValue ("indect")), NaN)));	// Decimal digits
    if (isNaN (decdigits)) {
	decdigits = 7;
    }
    var o = numfmt;				// Previous number format
    numfmt = EvalSel ("innums");		// Number format
    sortdir1 = EvalSel ("indir1s") ? -1 : 1;	// Sort 1 direction
    sortdir2 = EvalSel ("indir2s") ? -1 : 1;	// Sort 2 direction
    if (selectb && (d !== decdigits || o !== numfmt) &&
      (state === Z_NONE || state === Z_RESULT)) {
	Display (selectr, selectb);		// Re-display numbers?
    }
    if (fn >= 0 && state >= Z_MANY) {		// Re-sort search results?
	TruncTable ("tablist", 0);		// Don't mix result list with result table
	Sort (true, fn ? 0 : pageno);
    }
}
// Select sort criteria
function SelSort (review) {
    defsort1 = EvalSel ("insort1s");
    defsort2 = EvalSel ("insort2s");
    if (review) {
	SelView (1);
    }
}
// Re-initialize user interface state
function ReInit (fn) {
    nfound = 0;
    Deselect ();			// Deselect current selection, if any
    if (status !== Z_LOADING) {
	View (Z_RESET);			// Hide result-dependent fields
	SetText ("txtstatus", "");
    }
    Criteria ();			// Reset user-defined search criteria
    SelSort (0);			// Reset user-defined sort direction
    SelView (fn);			// Reset user-defined viewing criteria but don't sort old results
}
// Scroll to first page
function Home () {
    ReTime ();				// Reset tool-tip timer
    if (pageno > 0) {			// Display first page
	Sort (false, 0);
    }
}
// Scroll to last page
function End () {
    ReTime ();				// Reset tool-tip timer
    if (pageno < npages-1) {		// Display last page
	Sort (false, npages-1);
    }
}
// Scroll up one page
function PgUp () {
    ReTime ();				// Reset tool-tip timer
    if (pageno > 0) {			// Display previous page
	Sort (false, pageno-1);
    }
}
// Scroll down one page
function PgDn () {
    ReTime ();				// Reset tool-tip timer
    if (pageno < npages-1) {		// Display next page
	Sort (false, pageno+1);
    }
}
// User changed page number via selection box
function Pages (p) {
    Sort (false, GetSel ("inpages" + (p ? "2" : "")));
}
// User changed page number via text box
function Paget (p) {
    var i = floor (ParseLfloat (GetValue ("inpaget" + (p ? "2" : "")), NaN));
    if (isNaN (i)) {
	i = 0;
    }
    Sort (false, i-1);
}
// Get combined status of all criterion panel checkboxes
function GetBoxes () {
    var a = 0;
    for (var i = 0; i < O_ANY; ++i) {
	a += GetChecked ("cat"+catlist[i]) && (1 << i);
    }
    return a;
}
// "..." button pressed: show category selection panel
function CatDots () {
    CatBox ();
    FitObj ("catbox", ObjRel (Id ("indots")));
    ShowB ("catbox", true);
    ShowI ("indots", false);
    oldcats = GetBoxes ();
}
// Update category panel controls, based on selections
function CatBox () {
    var a = GetBoxes ();
    SetChecked ("catall", a === OM_ALL);
    SetIndeterminate ("catall", 0 < a && a < OM_ALL);
    Criteria ();
}
// Set a specific mask of categories
function CatMany (a) {
    for (var i = 0; i < O_ANY; ++i) {
	SetChecked ("cat"+catlist[i], (a >> i) & 1);
    }
    CatBox ();
}
// Category panel OK button pressed: hide category panel
function CatOK () {
    ShowB ("catbox", false);
    ShowI ("indots", true);
}
// Category panel Cancel button pressed: like OK, but restores previous value
function CatCancel () {
    CatMany (oldcats);
    CatOK ();
}
// Category panel All checkbox clicked: select all or none
function CatAll () {
    CatMany (GetChecked ("catall") ? OM_ALL : 0);
}
//-------------------------- Search Catagolue ---------------------------------
// Sanitize a number passed to Catagolue.
// undefined, NaN, _, and negative numbers return 0; reals are rounded.
function CatNum (n) {
    return isNaN (n) || n < 0 || n === _ ? 0 : round (n);
}
// Search Catagolue censuses
var typeurls = [				// Catagolue URLs for diffrent search types
    url_home, url_attr, url_census, url_haul, url_obj, url_text, url_text,
    url_rules, url_stat, url_text, url_census, url_user];
var typerules  = [0,-1,-1,1,1,1,1,0,0,1,-1];	// 0=no rule; 1=rule required; -1=rule optional
function Catagolue () {
    var e = "";					// Error message
    var r = 0;					// Is rule required?
    var t = EvalSel ("cattypes");		// Search type
    var i;
    ShowI ("cathauls", i = t === T_HAUL);
    var h = (h = i && EvalSel ("cathauls")) ? url_comm + h : "";	// Haul type
    ShowR ("catnamer", i |= t === T_USER);
    var u = i ? GetValue ("catnamet") : "";	// User name
    var n = t === T_ATTR || t === T_OBJECT;	// Need pattern?
    ShowR ("catobjr", n);
    var j = n && EvalSel ("catobjs");
    ShowI ("catobj", j);
    ShowI ("catobjt", !j);
    var o = n ? j ? catobj : GetValue ("catobjt") : "";	// Object name
    ShowR ("catruler", i = typerules[t]);
    var r = i ? GetValue ("catrules") : "*";		// Rule
    ShowI ("catrule", j = r === "!");
    ShowI ("catrulet", i = r === "?");
    r = RleRule (j ? GetValue ("catrule") : (i ? GetValue ("catrulet") : r), false);	// Custom rule
    r = r === "*" ? "" : r;
    ShowR ("catsymmr", i = r !== "" && !n && t !== T_SYNL && t !== T_SYNT);
    var s = i ? GetValue ("catsymms") : "*";		// Symmetry
    ShowI ("catsymmt", i = s === "?");
    s = i ? GetValue ("catsymmt") : s;
    s = s === "*" ? "" : s;
    ShowR ("catcatr", i = s !== "" && t !== T_HAUL && t !== T_COUNT);
    var c = i ? EvalSel ("catcats") : O_ANY;		// Category
    ShowR ("catdater", i);
    var y = i ? EvalSel ("catyys") : 0;			// Date
    ShowI ("catmmp", i = i && y);
    var m = i ? GetValue ("catmms") : "00";
    var d = i ? GetValue ("catdds") : "00";
    ShowR ("catpopr", i = c === O_STILL);
    var p = CatNum (i && ParseUfloat (GetValue ("catpopt")));	// Population
    // Life known values: all 4-72; 74; 76; 78; 80; 82-84; 86; 88; 90-92; 94; 96-98; 88;
    // evens 100-112; 123; fours 116-240; eights 248-272;
    // 2/2 Life possible values: 12, 18, 24-(every 3)-54, 56-57, 60, 62+
    // 3/4 Life possible values: 4, 36, 44, 50-51, ++
    // Niemiec1 possible values: 4-12, 14, 16, 18, 20, 22, 26, 36, 48, ...
    // Niemiec0+2+4+5 possible valueS: N/A
    ShowI ("catosct", i = c === O_OSC);
    var q = CatNum (i && ParseUfloat (GetValue ("catosct")));	// Oscillator period
    ShowI ("catsst", j = c === O_SS);
    q = q || CatNum (j && ParseUfloat (GetValue ("catsst")));	// Spaceship period
    ShowR ("catperr", i || j);
    ShowI ("catpufft", i = c === O_PUFF);
    q = q || CatNum (i && ParseUfloat (GetValue ("catpufft")));	// Puffer repeat factor
    ShowI ("catgunt", j = c === O_GUN);
    q = q || CatNum (j && ParseUfloat (GetValue ("catgunt")));	// Gun repeat factor
    ShowR ("catmodr", i || j);
    if (t === T_USER) {				// User name
	e = u === "" ? sNeedUser : "";
    } else if (!typerules[t]) {			// No rules or other parameters
    } else if (r === "" && typerules[t] > 0) {	// Rule required but not given
	e = sNeedRule;
    } else if (s === "" && (t === T_COUNT || t === T_LIST)) {	// Symmetry required
	e = sNeedSymm;
    } else {
	u = r + (s = s !== "" ? "/" + s + (y ? "-"+y+"-"+m+"-"+d : "") : "");
	if (n) {				// Object or its attributes
	    e = o === "" ? sNeedPattern : "";
	    u = o + "/" + r + s;
	} else {
	    if (t === T_SYNL || t == T_SYNT) {	// Syntheses
		u += url_costs;
	    } else {
		u += "/" + catapg[c];
		if (t === T_COUNT) {		// Object count
		    u += url_count;
		} else if (c === O_STILL) {		// Still life + population
		    e = p ? "" : sNeedPop;
		    u += p;
		} else if (c === O_OSC) {		// Oscillator + period
		    e = q > 1 ? "" : sNeedPeriod2;
		    u += q;
		} else if (c === O_SS) {		// Spaceship + period
		    e = q ? "" : sNeedPeriod;
		    u += q;
		} else if (c <= O_GUN) {		// Puffer/gun + modulus
		    e = q ? "" : sNeedRepeat;
		    u += q;
		}
	    }					// Irregular categories w/o qualifiers
	}
    }
    ShowR ("caturlr", 1);
    i = e === "";
    ShowI ("caturl", i);
    u = t === T_SYNT && !r ? url_synth : (typeurls[t] + u + h).replace (/\/\//g, "/");	// URL
    SetText ("caturl", u);
    SetHref ("caturl", u);
    ShowI ("caterr", !i);
    SetText ("caterr", e);			// Error message
}
//---------------------------- Search Rules -----------------------------------
// Set color of a outer totalistic rule button; return 1 if outer totalistic
function RuleTotal (h, s, n) {
    var t = rules[h][s][n] === 0 || rules[h][s][n] === (1 << narrs[h][n]) - 1;
    SetBg ((h?"H":"M") + (s?"S":"B") + n, t ? rules[h][s][n] ? C_RULE_ON : C_RULE_OFF : C_RULE_PART);
    return t;
}
// Set color of non-totalistic rule button
function RuleDraw (h, s, n, a) {
    SetBg ((h?"H":"M") + (s?"S":"B") + n + hensel[h][n][a],
      rules[h][s][n] & (1 << a) ? C_RULE_ON : C_RULE_OFF);
}
// Set state of a rule arrangement
function RuleSet (h, s, n, a, c) {
    rules[h][s][n] = rules[h][s][n] & ~(1 << a) | (c << a);
}
// Set color of all buttons; return 1 if rule is outer totalistic
function RuleShow (h) {
    var p = 1;
    for (var s = 0; s < 2; ++s) {
	for (var n = 0; n <= nnbrs[h]; ++n) {
	    p &= RuleTotal (h, s, n);
	    for (var a = narrs[h][n]; --a >= 0; ) {
		if (narrs[h][n] > 1) {
		    RuleDraw (h, s, n, a);
		}
	    }
	}
    }
    return p;
}
// Generate one row of the rule table
function RuleRow (h, c, b, d) {
    c += "";
    for (var i = 0; i < nnbrs[h]; ++i) {
	c += (b >> i) & 1;
    }
    return c + d + "\n";
}
// Convert list of MDN rules into string of commands, up to 4 digit-pairs at a time
function Mdn2Chars (s, n) {
    var list = "";			// Total output list
    var chunk = "";			// Current output chunk
    for (var i = 0; i < n.length; ++i) {
	if (chunk.length >= 8) {
	    list += chunk + (s ? "^L" : "^B");
	    chunk = "";
	}
	chunk += ("" + floor (n[i]/10)) + n[i]%10;	// Add zero-filled digit pair
    }
    if (chunk.length) {
	list += chunk + (s ? "^L" : "^B");
    }
    return list;
}
// Convert internal rule into RLE rule string, and display it and buttons
function RuleMake (u) {
    var r = "";				// Rule string
    var t = "";				// Rule table
    var h = rules[0][0][9];		// Hexagonal rule?
    var p = RuleShow (h);		// Outer totalistic rule?
    var mdn0 = h ? "^\\+" : "^^";	// MDN rule string
    var mdn1 = "";			// MDN anti-rule string
    for (var s = 0; s < 2; ++s) {
	r += s ? "/S" : "B";
	var mdn = [[99], []];		// MDN rule and anti-rule digit strings
	for (var n = 0; n <= nnbrs[h]; ++n) {
	    var m = narrs[h][n];	// Maximum number of bit variants for this neighborhood
	    var b = rules[h][s][n];	// Mask if live bit variants for this neighborhood
	    if (b) {
		r += n;
		if (b < ((1 << m) - 1)) {		// Non-totalistic neighborhood
		    var j = bitpops[b];
		    var q = j+j > narrs[h][n]+1;	// Is it cheaper to reverse bits?
		    if (q) {
			r += "-";
			b = ~b;
			mdn[0].push (n);
		    }
		    for (var a = 0, v = []; a < m; ++a) {
			if (b & (1 << a)) {
			    v.push (hensel[h][n][a]);
			    var z = mdn2native[h][n].indexOf (a);	// Map native bit to MDN
			    mdn[+q].push (10*n + z + (z > 9 && 37))	// 4A..4C -> 87..89
			}
		    }
		    r += v.sort () .join ("");	// Canonical form requires letters to be sorted
		} else {			// Outer-totalistic neighborhood
		    mdn[0].push (n);
		}
	    }
	}
	mdn0 += Mdn2Chars (s, mdn[0]);
	mdn1 += Mdn2Chars (s, mdn[1]);
    }
    mdn0 += (mdn1.length ? "-" + mdn1 + "+" : "") + ";";
    for (var n = 0; n <= nnbrs[h]; ++n) {
	for (a = 0; a < narrs[h][n] && (!a || !p); ++a) {
	    b = (rules[h][0][n] >> a) & 1;
	    s = (rules[h][1][n] >> a) & 1;
	    j = p ? (1 << n) - 1 : rulebits[h][n][a];
	    if (b === s) {		// birth or death
		t += RuleRow (h, b ^ 1, j, b);
	    } else if (b > s) {		// birth and death
		t += RuleRow (h, 0, j, b) + RuleRow (h, 1, j, s);
	    }				// neither birth nor death: default
	}
    }
    n = 2 << nnbrs[h];
    a = ceil (n/6);
    b = new Array (a).fill (0);
    for (j = 0; j < n; ++j) {
	var m = mdntotal[h][h?j>>1&0x30|j&7:j>>1&0xF0|j&0xF];	// MDN neighborhood
	m = rules[h][j>>(h?3:4)&1][rulebits[h][floor (m/16)][m%16]];
	b[floor (m/6)] |= 0x20 >> (m%6);
    }
    for (var m="MAP", j = 0; j < a; ++j) {			// base64-encoded MAP string
	m += base64[b[j]];
    }
    t = (p ? "permute\n" : (h ? "rotate6reflect\n" : "rotate4reflect\n")) + t;
    for (j = 0; j < 2; ++j) {
	SetBg ((j?"H":"M")+"H0", h ? C_RULE_OFF : C_RULE_ON);
	SetBg ((j?"H":"M")+"H1", h ? C_RULE_ON : C_RULE_OFF);
	for (n = j?7:10; --n >= 0; ) {
	    ShowR ((j?"H":"M")+n, j === h);
	}
    }
    r += h ? "H" : "";
    SetValue ("table", "@RULE " + r.replace (/\//, "") + "\n@TABLE\nn_states:2\nneighborhood:" +
      (h ? "hexagonal" : "Moore") + "\nsymmetries:" + t + "@COLORS\n1 255 255 255 white\n");
    SetHref ("goepp2", j = url_epp + ApgEpp (r) + "/");
    SetText ("goepp2", j);
    SetHref ("goapg2", j = url_census + ApgEpp (r) + "/");
    SetText ("goapg2", j);
    ShowB ("nbrmoore", !h);
    ShowB ("nbrhex", h);
    ShowR ("rulename", true);
    ShowR ("rulemdn", true);
    ShowR ("rulemap", true);
    ShowR ("ruletable", true);
    ShowR ("ruleapg", !h);
    ShowR ("ruleepp", p && !h);
    if (u >= 0) {				// Changed rule string or toggled button: change MDN string
	SetValue ("mdnrule", mdn0);
    }
    if (u <= 0) {				// Changed MDN string or toggled button: change rule string
	SetValue ("rule", r);
    }
    if (!u) {					// Toggled button: select and focus on rule string
	Select ("rule");
	Focus ("rule");
    }
    SetText ("catrule", r);
    SetText ("rulemapt", Wrap (m, 60));
    Catagolue ();
}
// RuleUndo last operation
function RuleUndo () {
    for (var h = 0; h < 2; ++h) {
	for (var s = 0; s < 2; ++s) {
	    for (var n = 0; n < 10; ++n) {
		var t = rules[h][s][n];
		rules[h][s][n] = undone[h][s][n];
		undone[h][s][n] = t;
	    }
	}
    }
    RuleMake (0);
}
// Backup the current state, for a subsequent RuleUndo
function RuleDo () {
    for (var h = 0; h < 2; ++h) {
	for (var s = 0; s < 2; ++s) {
	    for (var n = 0; n < 10; ++n) {
		undone[h][s][n] = rules[h][s][n];
	    }
	}
    }
}
// Click on hex button, and toggle it
function RuleHex (h) {
    RuleDo ();
    rules[0][0][9] = h;
    for (var s = 0; s < 2; ++s) {
	for (var n = 0; n < 9; ++n) {
	    rules[h][s][n] &= (1 << narrs[h][n]) - 1;
	}
    }
    RuleMake (0);
}
// Swap position of rule image and text table
var ruleswap = 0;
function RuleSwap () {
    ruleswap ^= 1;
    ShowB ("divnbr", !ruleswap); ShowR ("tabnbr", ruleswap);
    Id (ruleswap ? "divnbr" : "boxnbr").removeChild ("divimg");
    Id (ruleswap ? "boxnbr" : "divnbr").appendChild ("divimg");
    var swap = (ruleswap ? Udarrow : Uuarrow) + sSwap;
    SetText ("MW0", swap); SetText ("HW0", swap);
}
// Click on a rule button, and toggle it
// f = totalistic*0x200 + survival*0x100 + neighbors*0x10 + arrangement
function RuleToggle (f) {
    RuleDo ();
    var s = (f>>8) & 1;			// Survival?
    var n = (f>>4) & 0xF;		// Neighbors
    var a = f & 0xF;			// Arrangement
    var h = rules[0][0][9];		// Hexagonal?
    if (f & 0x200) {			// Outer totalistic
	var c = rules[h][s][n] !== (1 << narrs[h][n]) - 1;
	for (a = narrs[h][n]; --a >= 0; ) {
	    RuleSet (h, s, n, a, c);
	}
    } else {				// Non-totalistic
	RuleSet (h, s, n, a, (rules[h][s][n]&(1<<a)) === 0);
    }
    RuleTotal (h, s, n);
    RuleMake (0);
}
// Update internal rules based on input RLE rule string
function RuleParse () {
    RuleDo ();
    var r = Id ("rule").value.replace (/ /g, "");
    var h = rules[0][0][9] = + (r[r.length-1] == "H");	// Hexagonal rule? (must be uppercase H)
    r = r.substring (0, r.length-h).toLowerCase ();
    for (i = 0; i < specnames.length; ++i) {
	if (specnames[i] === r) {	// Special named rules
	    r = specrules[i];
	    break;
	}
    }
    for (var s = 0; s < 2; ++s) {	// Default to nothing
	rules[h][s].fill (0);
    }
    for (var i = 0, s = 1, n = 0, p = -1; i < r.length; ) {
	var c = r[i++];
	var j = "012345678".indexOf (c);
	if (c === "b") {		// B: start births
	    s = n = 0;
	    var p = -1;
	} else if (c === "s") {		// S: start survivals
	    s = 1;
	    n = 0;
	    p = -1;
	} else if (c === "/") {		// /: switch births<->survivals
	    s ^= 1;
	    n = 0;
	    p = -1;
	} else if (c === "-") {		// -: turn off neighbors
	    p = 0;
	} else if (c === "+") {		// +: turn on neighbors
	    p = 1;
	} else if (j >= 0 && j <= nnbrs[h]) {	// neighborhood
	    n = j;
	    p = 1;
	    if (i >= r.length || hensel[h][n].indexOf (r[i]) < 0 &&
		(!h || henselh[n].indexOf (r[i]) < 0)) {
		rules[h][s][n] = (1 << narrs[h][n]) - 1;
	    }
	} else if (p >= 0 && ((j = hensel[h][n].indexOf (c)) >= 0 ||
	  h && (j = henselh[n].indexOf (c)) >= 0)) {	// arrangement
	    rules[h][s][n] = rules[h][s][n] & ~(1<<j) | (p<<j);
	}
    }
    RuleMake (1);
}
// Update internal rules based on input RLE rule string
// rule = command*
// command = + | - | ^^ | ^\ | digits ^B | digits ^L
function RuleMdn () {
    RuleDo ();
    var r = Id ("rulemdn").value.replace (/;.*$/, "").replace (/ /g, "").replace (/\^\^/g, "\x1E03B0203L").replace (/\^\\/g, "\x1C2021B02L").replace (/\^/g, "");
    var p = 0;					// 0 = + (default); 1 = -
    var h = 0;					// 0 = Moore: ^^ (default); 1 = Hex: ^
    var n = 0;					// Accumulated number
    for (var i = 0; i < r.length; ++i) {
	var s = 0;				// 0 = Birth: ^B; 1 = Survival: ^L
	switch (r[i]) {
	case "\x1E":	h = 0; break;		// ^^: Moore neighborhood
	case "\x1C":	h = 1; break;		// ^\: Hex neighborhood
	case "+":	p = 0; break;		// +: positive rules
	case "-":	p = 1; break;		// -: negative rules
	case "L":	s = 1;			// n^L: add survival conditions
	case "B":				// n^B: add birth conditions
	    for (; n; n = floor (n/100)) {
		var j = n % 100;		// Digit pair
		var t = j >= 87 && j <= 89 ? 4 : floor (j/10);	// Totalistic condition group
		var c = j >= 87 && j <= 89 ? j - 77 : j % 10;	// Non-totalistic sub-condition
		c = mdn2native[h][t][c] || 0;			// Native sub-condition
		if (j === 99) {			// 99^B: erase all conditions
		    rules[h][s].fill (0);
		} else if (p) {
		    if (t) {			// -nn^B: remove non-totalistic condition
			rules[h][s][t] &= ~ (1 << c);
		    } else {			// -0n^B: remove totalistic condition
			rules[h][s][j] = 0;	// (this combination should never normally occur)
		    }
		} else {
		    if (t) {			// +nn^B: add non-totalistic condition
			rules[h][s][t] |= 1 << c;
		    } else {			// +0n^B: add totalistic condition
			rules[h][s][j] = (1 << narrs[h][j]) - 1;
		    }
		}
	    }
	    break;
	case "L":				// n^B: add survival conditions
	    for (; n; n = floor (n/100)) {
		if ((j = n % 100) == 99) {	// 99^B: erase all survival rules
		    rules[h].fill (0);
		} else if (s) {			// -nn^B: remove birth rule
		    rules[h][M.floor (j/10)] &= ~ (1 << n%10);
		} else {			// +nn^B: add birth rule
		    rules[h][M.floor (j/10)] |= 1 << n%10;
		}
	    }
	    break;
	default:				// digit: accumulate number
	    j = r[i].charCodeAt (i);
	    if (j >= A_0 && j <= A_9) {
		n = 10*n + j-A_0;
		continue;
	    }
	    break;
	}
	n = 0;
    }
    RuleMake (-1);
}
//------------------------------ Initialization functions ---------------------
// Globals used only during initialization
var bitPop = new Array (256);			// Populations of all bytes
var numitems = NUMITEMS;			// Total number of items to load
var numloaded = 0;				// Number of items loaded so far
var autorun = false;				// Automatically search?
var everexp = false;				// Expanded object list ever used?
var defhdr = null;				// Header being updated
var defobj = null;				// Object being updated
var defrule = -1;				// Rule being defined
var defexp;					// Expanded object list?
var deffreq;					// Default frequency
var defvelx;					// Default x velocity numerator
var defvely;					// Default y velocity numerator
var defveld;					// Default velocity denominator
var defvol;					// Default volatility
var defsvol;					// Default strict volatility
var defpage;					// Default page number+1 (0 if none)
var defheat;					// Is default heat supplied?
var defleft;					// Number of images needed
var oldnbr = 0;					// Neighborhood on previous pattern
var gu_p1;					// Index into unknown still-lifes
var g4_p1;					// Index into 4-glider still-lifes
var g5_p1;					// Index into 5-glider still-lifes
var g6_p1;					// Index into 6-glider still-lifes
var g7_p1;					// Index into 7-glider still-lifes
var g5_pp1;					// Index into 5-glider pseudo-still-lifes
var g6_pp1;					// Index into 6-glider pseudo-still-lifes
var g7_pp1;					// Index into 7-glider pseudo-still-lifes
var g7_pp15;					// Index into 7-glider period 15 pseudo-oscillators
// Calculate population of a library pattern
// This will be zero for huge patterns (e.g. Gemini)
function CalcPop (str) {
    var p = 0;
    for (var i = 2; i < str.length; ) {
	p += bitPop[str.charCodeAt (i++)];
    }
    return p;
}
// Post-process most recently-entered object after its last sub-line is read.
function EndObj (p) {
    if (!p) {
	return;
    }
    p.p_boxw = abs (p.p_boxw);			// Normalize small box values
    p.p_boxh = abs (p.p_boxh);
    p.p_lboxw = abs (p.p_lboxw);
    p.p_lboxh = abs (p.p_lboxh);
    p.p_hullw = abs (p.p_hullw);
    p.p_hullh = abs (p.p_hullh);
    var h = rulelib[defrule];			// Rule being added to
    h = h[h.length - 1];			// Header being added to
    var r = IsArray (p.p_img) ? p.p_img.length : 1;	// # of images
    if (h.h_cid >= O_WS && h.h_cid <= O_BR ||	// Expanding objects can't show all generations
      h.h_cid === O_METH) {			// Methuselahs are irregular
    } else if (r < defleft) {			// Missing S lines?! @@@
	toofew += (defleft-r) + " missing S lines in " + p.p_GetFile () + ": " + p.p_GetNames () + "\n";
    } else if (r > defleft) {			// Spurious S lines?! @@@
	toomany += (r-defleft) + " extra S lines in " + p.p_GetFile () + ": " + p.p_GetNames () + "\n";
    }
    r = min (r, defleft);			// Only count main phases
    var a = OrderNum (p.p_avgp);		// Average population
    if (p.p_avgp < 0) {				// Normalize average population
	a = p.p_avgp /= -r;
    }
    if (!p.p_vol && p.p_per === 2 && !p.p_velx) {	// For period 2 oscillators, volatility is
	p.p_vol = p.p_svol = 2*p.p_heat / (p.p_heat+2*a);	// 2*heat/(heat+2*avgp)
    }
    if (p.p_temp < 0) {				// Normalize temperature value
	p.p_temp = p.p_heat / p.p_GetAct ();	// Compute temperature
    }
    if (p.p_minp == 18 && p.p_gls === TBD && p.p_heat === 2) {	// All 18-bit beaconoids can be synthesized
	p.p_gls = KNOWN;
    }
    if (a < p.p_minp) {				// Average < minimum ?! @@@
	badavg += p.p_GetFile ()+": "+p.p_GetNames ()+": avgp="+a+" < minp="+p.p_minp+"; "+r+"\n";
    }
    if (p.p_vol > 1) {				// Volatility > 1 ?! @@@
	badvol += p.p_GetFile ()+": "+p.p_GetNames ()+": vol="+p.p_vol+" > 1: heat="+p.p_heat+" avgp="+a+"\n";
    }
    TrackU (p);					// Track unique values	// @@@
    defobj = null;
}
// Begin a new library
// This should be followed by zero or more H lines
function N (index) {
    EndObj (defobj);
    if (defrule >= 0) {
	var f = rulefiles[defrule];
	for (var i in f) {
	    if (f[i] !== 1) {
		// Legitimate files used 2x:
		//  9bkgl 15be 16lm 18dv 29p3-1 32kcf 32rats 33p6-1 35ckii 35pw
		//  36cd2 38p11-1 42p10-1 44p4 46tbd 48oo 60hz2 98p25-1 104p25-1;
		//  b34s34: 28titan; niemiec1: g280gl g280dg
		// Legitimate files used 3x:
		//  23ge 26gc 29p41234 30p3hu 37p8hz; b34s34: 18agta 45eta
		// Legitimate files used 5x: 31ei 46p10-1
		// Legitimate file used 9x: 32p8cd
		console.log (i + ": " + f[i]);
	    }
	}
    }
    defrule = index;
    gu_p1 = g4_p1 = g5_p1 = g6_p1 = g7_p1 = g5_pp1 = g6_pp1 = g7_pp1 = g7_pp15 = 0;
    defexp = false;
}
// Begin expanded object lists
function Expanded () {
    ShowR ("inexpr", everexp = defexp = true);
    ActiveText ("exp", everexp, true);
    numitems = NUMXITEMS;
    SetMax ("progsearch", numitems);
}
// Add a header line to the currently-selected library
// This should be followed by zero or more P, PP, V, A, and/or Y lines
// name = section [- subsection]
// cat = [!]category description string
function Hss (c) { return c == "o" || c == "d" || c == "k"; }	// Does section letter specify a spaceship velocity?
function IsDigit (c) { return c >= "0" && c <= "9"; }		// Is a character a digit?
function H (name, cat) {
    EndObj (defobj);
    var gls = TBD;			// Default number of gliders
    if (cat[0] === "!") {		// !description => all synthesizable
	cat = cat.substring (1);	// (if not, all exceptions are explicitly supplied)
	gls = KNOWN;
    }
    var sec = name;			// Section name
    var sub = "";			// Sub-section name
    var i = sec.indexOf ("-");
    if (i >= 0) {
	sub = sec.substring (i+1);
	sec = sec.substring (0, i);
    }
    var pseudo = sec.substring (0, 2) === "pp";		// pseudo-object?
    var per = parseInt (sec.substring (pseudo+1));	// period
    var minp = per && parseInt (sub);			// population
    var r = rulelib[defrule];				// Rule being added to
    var cid = catlist.indexOf (sec);			// Category index
    if (sub === "bad") {				// Ignore bad objects
	defhdr = null;
	return;
    }
    if (Hss (sec[0]) || IsDigit (sec[0]) && Hss (sec[1])) {	// o2, d2, k2, 2o5, etc. => ss
	cid = O_SS;
    } else if (per === 1) {				// P1/PP1: still/pseudo-still
	cid = O_STILL + pseudo;
    } else if (per > 1) {				// Pn/PPn: osc/pseudo-osc
	cid = O_OSC + pseudo;
    } else if (cid < 0) {				// Other (eg. gu-qp1) => cons
	cid = O_CONS;
    }
    defvelx = defvely = defvol = defsvol = 0;
    defveld = 1;
    deffreq = NaN;
    defheat = false;
    defpage = -1;
    if (cid >= O_WS && cid <= O_BR) {	// Expanding patterns:
	defvol = 1;			// Always volatile
	if (cid >= O_GUN) {		// Guns and breeders are strictly volatile
	    defsvol = 1;
	}
    } else if (cid === O_METH) {	// Methuselahs are unpredictable
	defvol = NaN;			// (and MUST have explicit overrides!)
    } else {				// "normal" objects may have heat
	defheat = true;
	if (defrule === R_B3S23 && (cid === O_STILL || cid === O_OSC)) {
	    deffreq = 0;		// Frequency OK for Life still-lifes, oscillators
	}				// (but NOT pseudo-ones or quasi-ones!)
    }
    r.push (defhdr = new Header (defrule, Dash (rulesec[defrule], name), sec, sub, cat, cid,
      defexp, gls, pseudo, per, minp < LG ? minp : NaN, []));
}
// Add a page-group qualifier line to the currently-selected header
// This is done once to indicate that two-digit page-numbers are to be used
// This should be followed by zero or more P, A, V, and/or Y lines
function PP () {
    EndObj (defobj);
    defpage = 100;
}
// Add a page-break qualifier line to the currently-selected header
// This should be followed by zero or more A, V, and or Y lines
function P () {
    EndObj (defobj);
    ++defpage;
}
// Add a velocity qualifier line to the currently-selected section
// This should be followed by zero or more A and/or P lines
function V (d, x, y) {
    EndObj (defobj);
    defveld = d
    defvelx = x;
    defvely = y;
    defvol = 1;				// spaceships are totally volatile
}
// Parse a number that may involve orders of magnitude
// i.e. x_y => x*t^y; x_ => x*t; _=t; ?_y => ?*t^y;
function ParseOrder (s) {
    var t = s.indexOf ("_");
    if (t < 0) {			// Normal real number
	t = ParseSfloat (s);
	o = 0;
    } else {
	var o = ParseSfloat (s.substring (t+1), 0) || 1;
	t = ParseSfloat (s.substring (0, t), 0) || 1;
    }
    return CacheOrder (t, o);
}
// Convert an order number pair into a cache index
function CacheOrder (t, o) {
    if (t === 0 || !o && !isNaN (t)) {	// 0*t^any, real*t^0 => real
	return t;
    }
    for (var i = 0; i < transval.length; ++i) {
	if (transord[i] === o && (isNaN (t) ? isNaN (transval[i]) : t === transval[i])) {
	    return i + OMEGA;
	}
    }
    transval.push (t);
    transord.push (o);
    return i + OMEGA;
}
// Vet file names; note missing ones, and count duplicates
var oldfile = "";
function AddFile (f) {
    if (f.length) {
	rulefiles[defrule][f] = (rulefiles[defrule][f] || 0) + 1;
	oldfile = f;
    } else {
	// Legitimate empty files in B2/S2: all (22) 22-p1 after 0vacuum; all (81) 22-btc after 13sss2;
	// Legitimate empty files in B36/S23: all (3) basilisks after blpush;
	// Legitimate empty files in B3/S23: all (9) gu-qp1 after 96pp1-1; many TBD in p2-18;
	console.log ("Empty file after " + oldfile);
    }
}
// Add an object to the currently-selected library
// This should be followed by zero or more S lines
// str = 6-bit encoding of: period, (optional heat*period), height, width, pattern
// (Heat*period is present if period!==1 or velocity!==0)
// Period, heat*period, height, and weight are zero if overriden below.
// Huge patterns like Caterpillar and Gemini have have illegal pattern HUGEPAT.
// file = zero or more semicolon-separated filenames w/no path or extension
// desc = zero or more semicolon-separated description (pattern name) strings
// gls = string of gliders and other optional annotations.
// Most annotations are optional, and override default values.
// Values are usually integers, except where noted.
// Rationals are integers, or integer/integer
// Some parameters allow ? (unknown/indeterminate) or _ (infinite)
// Some parameters allow transfinite values with infinite limits:
//   x_ = linear: t*x/period; ?_ = unknown, less than quadratic; x_2 = quadratic: t^2*x/period^2
//   x_3 = cubic (not currently used); x_real = fractal dimension
// (currently only used on b36s23::p96mr, whose Hausdorff dimension is ln(3)/ln(2)=1.5849625007211563)
// They must be in the following order:
//	  gliders		Integer or ?[+int] [-int] (default = TBD or Known)
//	" time to stabilize	Integer or _ (default = 0; nonzero only for methuselahs)
//	# frequency		Rational or ? (default = 0 for still/osc, ? for others)
//	$ heat*period		Rational or x_y or ? (default = 0)
//	% temperature		Rational or ? (default = heat/active cells)
//	& strict volatility	Rational or ? (default = volatility)
//	@ volatility		Rational (default = depends on category)
//	` hull width		Integer or x_y (default = maximal box width)
//	~ hull height		Integer or x_y (default = maximal box width)
//	{ maximal box width	Integer or x_y (default = maximum over widths)
//	} maximal box height	Integer or x_y (default = maximum over heights)
//	[ minimal box width	Integer (default = minimum over widths)
//	] minimal box height	Integer (default = minimum over heights)
//	| symmetry		Integer (default = 0 (none))[3][4]
//	( width			Integer (default = taken from pattern string[1])
//	) height		Integer (default = taken from pattern string[1])
//	^ influence		Integer or x_y (must always be present)
//	= average population	Integer or x_y (default = accumulated from pattern string[2][5])
//	> maximum population	Integer or x_y (default = accumulated from pattern string[2][5])
//	< minimum population	Integer (default = calculated from pattern string[2])
//	: period		Integer or ? (default = taken from pattern string[1])
//	r rotor width		Integer (default = 2 for osc, 0 for still, ? for others)
//	R rotor height		Integer (default = 2 for osc, 0 for still, ? for others)
//	l active rotor cells	Integer (default = 2 for osc, 0 for still, ? for others)
//	n number of rotors	Integer (default = 1 for osc, 0 for still, ? for others)
//	B rule(s)		Baa-bbScc-dd (default=current rule)
//	O hrd			Hickerson Rotor Descriptor (for oscillators or similar)
// (NOTE [1]: Only needed for patterns with measurements >223)
// (NOTE [2]: Only required for extremely huge patterns without image strings)
// (NOTE [3]: Symmetry is pattern symmetry + 10*glide symmetry + 100*flags.
//  flags = explicit + 2*odd_width + 4*odd_height + 8*dead
//  (and is computed by default if explicit flag is not given)).
// (NOTE [4]: This used to compute static pattern symmetry by calling Convert to
//  convert to RLE, Rle2Bin to convert to binary, and Symm to obtain symmetries
//  While this produces correct results, it is very time-consuming, and makes
//  page loading prohibitively expensive on slow machines. As a result, the
//  symmetry value is now pre-computed and stored in the database)
// (NOTE [5]: Only required for [2] or unstable patterns like methuselahs)
function A (str, file, desc, note, ify) {
    EndObj (defobj);
    if (!defhdr) {				// Ignore bad patterns
	return;
    }
    var r = rulelib[defrule];			// Rule being added to
    var hid = r.length - 1;			// Index of header being added to
    var o = defhdr.h_obj;			// Object list being added to
    var per = str.charCodeAt (0) - A_SP;	// Period
    var page = defpage;				// Page in multi-page list
    var gpage = -1;				// Page in huge glider pages
    var heat = 0;				// Heat
    var vol = defvol;				// Volatility
    var svol = defsvol;				// Strict volatility
    var freq = deffreq;				// Frequency
    var tts = 0;				// Time to stabilize
    var gls = 0;				// Gliders
    var glnr = 0;				// Machine-readable glider number
    var glna = 0;				// Glider number (all)
    var wiki = "";				// Wiki page?
    var apg = undefined;			// apg search name
    var diff = -1;				// Difficult still-life?
    var inf = 0;				// Influence
    var symm = Y_C1;				// Symmetry
    var soup = false;				// Found in soup?
    var rw = 0;					// Rotor width
    var rh = 0;					// Rotor height
    var act = 0;				// Active rotor cells
    var nr = 0;					// Number of rotors
    var color = 0;				// Color synthesis exists
    var file2;					// Alternate file description
    var i;
    if (defheat && (per !== 1 || defvelx)) {	// Extract total heat, if present
	heat = str.charCodeAt (1) - A_SP;
	str = str.substring (2);
    } else {
	str = str.substring (1);
    }
    var hgt = str.charCodeAt (0) - A_SP;	// Height
    var wid = str.charCodeAt (1) - A_SP;	// Width
    var boxw = -wid;				// Minimal bounding box width
    var boxh = -hgt;				// Minimal bounding box height
    var lboxw = boxw;				// Maximal bounding box width
    var lboxh = boxh;				// Maximal bounding box height
    var hullw = boxw;				// Hull width
    var hullh = boxh;				// Hull height
    var minp = defhdr.h_minp || CalcPop (str);	// Minimum population
    var maxp = minp;				// Maximum population (accumulated)
    var avgp = -minp;				// Average population (accumulated)
    var temp = -1;				// Temperature (accumulated)
    var hrd;					// Hickerson Rotor Descriptor
    if (str === "  " && per !== 1) {		// Huge patterns omit pattern image
	str = HUGEPAT;
    }
    if ((i = note.indexOf ("O")) >= 0) {	// O...: Hickerson Rotor Descriptor
	hrd = note.substring (i+1);
	note = note.substring (0, i);
    }
    if ((i = note.indexOf ("B")) >= 0) {	// Baa-bbScc-dd: used rule neighborhoods (uses other letters)
	oldnbr = Nbr2Mask (note.substring (i).toLowerCase ());
	note = note.substring (0, i);
    }
    for (i = note.length; --i >= 0; ) {		// Parse annotations right-to-left
	switch (note.charCodeAt (i)) {
	default:
	    continue;
	case A_n:				// nn => number of rotors
	    nr = parseInt (note.substring (i+1));
	    break;
	case A_l:				// ln => active rotor cells
	    act = parseInt (note.substring (i+1));
	    break;
	case A_R:				// Rn => rotor height
	    rh = parseInt (note.substring (i+1));
	    break;
	case A_r:				// rn => rotor width
	    rw = parseInt (note.substring (i+1));
	    break;
	case A_COLON:				// :n => period
	    per = ParseSfloat (note.substring (i+1), 0);	// can be _
	    break;
	case A_LT:				// <n => minimum population
	    temp = avgp = - (maxp = minp = ParseSfloat (note.substring (i+1), 0));	// can be ?
	    break;
	case A_GT:				// >n => maximum population
	    maxp = ParseOrder (note.substring (i+1));	// can be x_[y]
	    if (maxp >= OMEGA) {		// Infinite pop => infinite/2 avg
		avgp = OrderDiv (maxp, defhdr.h_cid === O_BR ? 6 : 2);	// Triangular or tetrahedral numbers
	    }
	    break;
	case A_EQ:				// =n => average population
	    avgp = ParseOrder (note.substring (i+1));	// can be x_[y]
	    break;
	case A_CFX:				// ^n => influence
	    inf = ParseOrder (note.substring (i+1));	// can be x_[y]
	    break;
	case A_RPAR:				// )n => height
	    hullh = lboxh = boxh = -(hgt = ParseSfloat (note.substring (i+1), 0));	// can be ?
	    break;
	case A_LPAR:				// (n => width
	    hullw = lboxw = boxw = -(wid = ParseSfloat (note.substring (i+1), 0));	// can be ?
	    break;
	case A_STILE:				// |n => symmetry
	    symm = parseInt (note.substring (i+1));
	    break;
	case A_RBRK:				// ]n => minimal box height
	    hullh = lboxh = boxh = parseInt (note.substring (i+1));
	    break;
	case A_LBRK:				// [n => minimal box width
	    hullw = lboxw = boxw = parseInt (note.substring (i+1));
	    break;
	case A_LBRC:				// }n => maximal box height
	    hullh = lboxh = ParseOrder (note.substring (i+1));	// can be x_[y], ?
	    break;
	case A_RBRC:				// {n => maximal box width
	    hullw = lboxw = ParseOrder (note.substring (i+1));	// can be x_[y], ?
	    break;
	case A_TILDE:				// ~n => hull height
	    hullh = ParseOrder (note.substring (i+1));	// can be x_[y], ?
	    break;
	case A_GRAVE:				// `n => hull width
	    hullw = ParseOrder (note.substring (i+1));	// can be x_[y], ?
	    break;
	case A_AT:				// @n => volatility
	    svol = vol = ParseSfloat (note.substring (i+1), 0);	// can be n/d
	    break;
	case A_AND:				// &n => strict volatility
	    svol = ParseSfloat (note.substring (i+1), 0);	// can be n/d
	    break;
	case A_PCT:				// %n => temperature
	    temp = ParseSfloat (note.substring (i+1), 0);	// can be n/d
	    break;
	case A_DOL:				// $n => total heat
	    heat = ParseOrder (note.substring (i+1));	// can be x_[y]
	    break;
	case A_NUM:				// #n => frequency
	    freq = parseInt (note.substring (i+1));
	    break;
	case A_DQ:				// "n => time to stabilize
	    tts = ParseSfloat (note.substring (i+1), 0);	// can be _ or ?
	    break;
	}
	note = note.substring (0, i);
    }
    if (str !== HUGEPAT) {			// For non-huge patterns:
	if (str.charCodeAt (0) !== hgt+A_SP ||	// Insert actual width/height
	    str.charCodeAt (1) !== wid+A_SP) {	// (Unicode supports up to 65503)
		str = String.fromCharCode (hgt+A_SP) +
		      String.fromCharCode (wid+A_SP) + str.substring (2);
	}
    }
    if (note === "") {				// Gliders unspecified (e.g. extended list)
	gls = defhdr.h_gls;
    } else if (note[0] === "?") {		// ?: Gliders unknown
	gls = UNKNOWN;
	if (note[1] === "+") {			// ?+n: partial
	    gls += parseInt (note.substring (2));
	}
    } else if (note[0] === "!") {		// !: Gliders TBD (unless all are known)
	gls = note[1] === "!" ? KNOWN : defhdr.h_gls;	// !!: Gliders known but non-specific
    } else {					// n: Specific gliders known
	gls = parseInt (note);
    }
    if (defhdr.h_cid === O_PSTILL) {
	if (gls === 5) {	// 5-glider pseudo-still-lifes have many stamps
	    gpage = g5_pp1++;
	} else if (gls === 6) {	// 6-glider still-lifes have many stamps
	    gpage = g6_pp1++;
	} else if (gls === 7) {	// 7-glider still-lifes have many stamps
	    gpage = g7_pp1++;
	}			// Other glider pseudo-still-lifes have one stamp each
    } else if (defhdr.h_cid === O_STILL) {
	if (gls === 4) {	// 4-glider still-lifes have many stamps
	    gpage = g4_p1++;
	} else if (gls === 5) {	// 5-glider still-lifes have many stamps
	    gpage = g5_p1++;
	} else if (gls === 6) {	// 6-glider still-lifes have many stamps
	    gpage = g6_p1++;
	} else if (gls === 7) {	// 7-glider still-lifes have many stamps
	    gpage = g7_p1++;
	} else if (gls >= UNKNOWN) {	// Unknown still-lifes have many stamps
	    gpage = gu_p1++;	// (not currently used)
	}			// Other glider still-lifes have one stamp each
	if (minp >= 13 && minp <= 14) {	// 13-14-bit still-lifes must fake page number:
				// Still-lifes up to 14 bits are sorted by index number
	    page = floor ((parseInt (file.substring (3)) - 1) / 100);
	}			// 4-12 fit on one page; 15+ use native ordering
    } else if (defhdr.h_cid === O_POSC && defhdr.h_per === 15) {
	if (gls === 7) {	// 7-glider period 15 pseudo-oscillators have many stamps
	    gpage = g7_pp15++;
	}
    }
    if (symm % 200 < 100) {	// No explicit parity: calculate it here
	symm = (symm % 100) + 100 + 200*(wid&1) + 400*(hgt&1) + 800*(minp===0) +
	  floor (symm / 1000) * 1000;
    }
    switch (symm % 10) {			// Normalize symmetry types
    case Y_D2P2:				// Vertical reflection => horizontal
	symm += Y_D2P - Y_D2P2;
	i = floor (symm % 1000 / 200);		// Swap axis parities
	symm = (symm % 200) + 200 * (i ^ (i === 0 || i === 3 ? 0 : 3)) +
	  floor (symm / 1000) * 1000;
	break;
    case Y_D2X2:				// Diagonal / reflection => diagonal 
	symm += Y_D2X - Y_D2X2;
	break;
    }
    switch (floor (symm/10) % 10) {		// Normalize glide symmetry types
    case Y_D2P2:				// Vertical reflection => horizontal
	symm += 10 * (Y_D2P - Y_D2P2);
	if (symm % 10 === Y_C1) {		// Swap axes if none defined yet
	    i = floor (symm / 200);
	    symm = (symm % 200) + 200 * (i ^ (i === 0 || i === 3 ? 0 : 3));
	}
	break;
    case Y_D2X2:				// Diagonal / reflection => diagonal 
	symm += 10 * (Y_D2X - Y_D2X2);
	break;
    }
    i = floor (symm/10) % 10;			// Glide symmetry => period/modulus
    var rmod = symm % 10;
    rmod = i === Y_C1 ? 1 : (i === Y_C4 && rmod === Y_C1 ? 4 : 2);	// any/none=1; 180/90=4; other=2
    symm += 1000 * rmod;
    if (per < _ && heat < OMEGA) {		// Compute heat from total heat
	heat = OrderDiv (heat, per);		// But heat _, period _ => heat _
    }
    if (file[0] === ">") {			// >file: soup exists
	soup = true;
	file = file.substring (1);
    }
    while (file[0] === "`") {			// `file: color synthesis exists
	++color;
	file = file.substring (1);
    }
    if ((i = file.indexOf ("|")) >= 0) {	// filename|apg search name
	apg = file.substring (i+1);
	file = file.substring (0, i);
    }
    if ((i = file.indexOf ("@")) >= 0) {	// filename@wiki-page (may contain ^)
	wiki = file.substring (i+1);
	file = file.substring (0, i);
    }
    if ((i = file.indexOf ("^")) >= 0) {	// filename^glider number (machine-readable)
	glnr = parseInt (file.substring (i+1));
	file = file.substring (0, i);
    }
    if (file.indexOf (";") >= 0) {		// Multiple filenames
	file = file.split (";");
	if((i = file[1].indexOf ("\"")) >= 0){	// Explicit alternate file description
	    file2 = file[1].substring (i+1);
	    file[1] = file[1].substring (0, i);
	}
	for (i = 0; !ify && i < file.length; i++) {
	    AddFile (file[i]);
	}
    }
    else if (!ify) {
	AddFile (file);
    }
    if (desc === "") {				// No description: unknown!
	desc = sUnknown;
    }
    if ((j = desc.indexOf ("Glider ")) >= 0 &&
      (j = parseInt (desc.substring (j+7)))) {	// Human readable glider number
	glna = j;
    }
    if (desc.indexOf (";") >= 0) {		// Multiple descriptions
	desc = desc.split (";");
	if (defhdr.h_cid === O_STILL && minp >= 14 && minp <= 18) {	// medium still-lifes
	    var j = desc[1];			// a.b; a#c => difficult still-life
	    if ((i = j.indexOf ("#")) > 0 && parseInt (j) === minp) {
		diff = parseInt (j.substring (i+1));
	    }
	}
    }
    o.push (defobj = new Pattern (hid*MAXPAT+o.length, str, file, apg,
      desc, defhdr.h_cid, minp, maxp, avgp, inf, heat, temp, vol, svol, symm,
      boxw, boxh, lboxw, lboxh, hullw, hullh, per, gls, freq, tts, defveld,
      defvelx, defvely, oldnbr, page+1 + (gpage+1)/PAIR, hid));
    defobj.p_hdr = defhdr;
    if (hrd) {					// Explicit Hickerson Rotor Descriptor
	defobj.p_hrd = hrd;
	if (!rulehrd[defrule][hrd]) { rulehrd[defrule][hrd] = []; }
	rulehrd[defrule][hrd].push (defobj);	// Group all patterns with the same rotor
    }
    if (file2) {				// Explicit alternate file description
	defobj.p_file2 = file2;
    }
    if (color) {				// Explicit color
	defobj.p_color = color;
    }
    if (soup) {					// Object found in soup (not currently used yet)
	defobj.p_soup = true;
    }
    if (glnr) {					// Explicit glider
	defobj.p_glnr = glnr;
	defobj.p_glna = glna;
    }
    if (wiki.length) {				// Explicit wiki string
	defobj.p_wiki = wiki.split (";");
	numwiki = max (numwiki, defobj.p_wiki.length);	// Count wiki pages
    }
    if (diff >= 0) {				// Explicit difficult object
	defobj.p_diff = diff;
    }
    if (per > 1 && !defvelx && hullw < OMEGA) {	// Rotor parameters
	defobj.p_rboxw = rw;
	defobj.p_rboxh = rh;
	defobj.p_act = act;
	defobj.p_nrotors = nr;
    }
    defleft = per / rmod;			// Number of images lines needed
    if (! (++numloaded % floor (numitems/100))) {		// Periodically update load status
	SetText ("txtstatus", sLoading_data_tables + Uhellip + " " +
	  min (100, round (numloaded*100/numitems)) + "% " + sdone + ".");
	SetValue ("progsearch", numloaded);
    }
}
// Add an object from a raw object list
// This is currently only used for still-lifes, pseudo-still-lifes,
// P2 oscillators, and P2 pseudo-oscillators.
// No information is available other than pattern index, image, symmetry, rotor, and rule
function Y (index, str, note) {
    var desc = defhdr.h_minp;		// Synthesized pattern description
    if (defhdr.h_cid === O_STILL) {	// still-life
	desc += "." + index;
    } else {
	desc += "-bit " +
	  (defhdr.h_per > 1 ? s_nameper + "-" + defhdr.h_per + " " : "") +
	  catnames[defhdr.h_cid] + " #" + index;
    }
    A (String.fromCharCode (defhdr.h_per+A_SP) + str, "", desc, note, 1);
}
// Add an object from a raw object list, without annotations
function F (index, str) {
    Y (index, str, "");
}
// Add a secondary image to the most recently added object
// str = 6-bit encoding of: height, width, (row of ceil (width/6) bytes)[height]
// height and weight are never overridden. Very few patterns exceed 223x223,
// and those only show the initial generation (if even that).
function S (str) {
    if (!defobj) {					// Ignore bad patterns
	return;
    }
    if (!IsArray (defobj.p_img)) {			// Turn first string into array
	defobj.p_img = [defobj.p_img];
    }
    defobj.p_img.push (str);				// Add new image
    var pop = CalcPop (str);				// Population
    var hgt = str.charCodeAt (0) - A_SP;		// Height
    var wid = str.charCodeAt (1) - A_SP;		// Width
    var c = hgt+wid + defobj.p_boxh+defobj.p_boxw;	// Half circumference difference
    var a = hgt*wid - defobj.p_boxh*defobj.p_boxw;	// Half area difference
    if (defobj.p_boxw < 0 && defobj.p_boxh < 0 && (c < 0 || c === 0 && a < 0)) {
	defobj.p_boxw = -wid;				// Smallest bounding box
	defobj.p_boxh = -hgt;
    }
    if (defobj.p_img.length > defleft) {		// Only first <mod> lines count
	return;
    }
    if (pop < defobj.p_minp) {				// Log patterns with bad low populations
	badpop += defobj.p_GetFile ()+": "+defobj.p_GetNames ()+" "+pop+" < "+defobj.p_minp + "\n";	// @@@
    }
    if (defobj.p_lboxw < 0 && defobj.p_lboxh < 0) {
	c = hgt+wid + defobj.p_lboxh+defobj.p_lboxw;
	a = hgt*wid - defobj.p_lboxh*defobj.p_lboxw;
	if (c > 0 || c === 0 && a  > 0) {
	    defobj.p_lboxw = -wid;	// Find largest bounding box
	    defobj.p_lboxh = -hgt;
	    if (defobj.p_hullw < 0 && defobj.p_hullh < 0) {
		defobj.p_hullw = -wid;	// Hull is the same
		defobj.p_hullh = -hgt;
	    }
	}
    }
    defobj.p_maxp = max (defobj.p_maxp, pop);		// Accumulate max population
    if (defobj.p_avgp < 0) {				// Accumulate population for average
	defobj.p_avgp -= pop;
    }
}
// Perform script initializations.
// This must be done here, now, before subsequent scripts are loaded.
// This might not be re-executed if browser reloads and preserves the page (depending on browser).
function Init () {
    for (var i = 0; i < 0x100; ++i) {			// Population of each character in pattern encoding:
	bitPop[i] = 0;
    }
    for (i = 0; i < 0x40; ++i) {			// Characters 32-95 are masks of 6 bits
	bitPop[i+0x20] = bitPop[(i>>1)+0x20] + (i&1);	// Characters 0-31 never used in library
    }							// Characters 96+ are runs of empty space
    for (i = 0; i < S_MAX; ++i) {			// Correspondence between selectors and sort types
	sortcols[EvalSel (GetOptions ("insort1s")[i])] = i;
    }
    canctx = GetContext ("canimg", "2d");		// HTML5 canvas context
    ifcan = canctx !== undefined;			// HTML5 canvas support exists?
    ShowI ("cansorts", ifcan);				// No canvas: hide help references to it
    GreyC ("inviewv", "inviewd", tok["views"] = false);	// Hide stamp option until font loaded
    ShowB ("vieweval", true);		// Show evaluation console	// @@@
    InitU ();								// @@@
    SetMax ("progsearch", numitems);
    ReInit (0);				// Re-initialize user interface state
    SetValue ("rule", "B2om/S2H");	// Default hex rule
    RuleParse ();
    SetValue ("rule", "B3/S23");	// Default Moore rule
    Loads ("" + window.location);	// Pre-load default form parameters
    Criteria ();			// Make sure search parameters are up to date
    Resize ();				// Accomodate fields to window size
    SelView (-1);			// Make sure view parameters are up to date
}
// This is called once all data sets have been loaded: it is now safe to Search
function DataLoaded () {
    View (Z_RESET);
    if (numloaded !== numitems) {	// Verify correct item count	// @@@
	SetText ("txtstatus", "" + numloaded + "/" + numitems + " " + spatterns_loaded + ".");
    } else
    {
	SetText ("txtstatus", "" + numloaded + " " + spatterns_loaded + ".");
    }
    ShowI ("loading", 0);
    if (autorun) {			// Launch search from a stamp collection
	Focus ("insearch");
	Search ();
    }
}
//------------------------------ Localization ----------------------------------
// Data formats that need localization
var eThousands = /,/;			// Thousands separator pattern (American)
var eDecimal = /\./;			// Decimal separator pattern (American)
var sDecimal = ".";			// Decimal separator string (American)
//var eThousands = /\./;		// Thousands separator pattern (European)
//var eDecimal = /,/;			// Decimal separator pattern (European)
//var sDecimal = ",";			// Decimal separator string (European)
// Names of input fields
var s_nameapg = "apg search name";
var s_nameact = "active rotor cells";
var s_nameaden = "average density";
var s_nameavgp = "average population";
var s_nameboxa = "smallest box area";
var s_nameboxc = "smallest box circumference";
var s_nameboxd = "smallest box diagonal";
var s_nameboxh = "smallest box height";
var s_nameboxs = "smallest box squareness";
var s_nameboxw = "smallest box width";
var s_namecat = "category";
var s_nameden = "minimum density";
var s_namediff = "difficult";
var s_nameepp = "Eppstein's glider repository";
var s_nameexp = "expanded pattern list";
var s_nameef = "evolutionary factor";
var s_namefile = "file name";
var s_nameglide = "glide symmetry";
var s_nameglna = "glider number (all)";
var s_nameglnr = "glider number (rule)";
var s_namegls = "gliders";
var s_namefreq = "frequency";
var s_nameheat = "heat";
var s_namehdr = "header name";
var s_namehrd = "Hickerson Rotor Descriptor";
var s_namehulla = "hull area";
var s_namehullc = "hull circumference";
var s_namehulld = "hull diagonal";
var s_namehullh = "hull height";
var s_namehulls = "hull squareness";
var s_namehullw = "hull width";
var s_nameimg = "image";
var s_nameinf = "influence";
var s_namelboxa = "largest box area";
var s_namelboxc = "largest box circumference";
var s_namelboxd = "largest box diagonal";
var s_namelboxh = "largest box height";
var s_namelboxs = "largest box squareness";
var s_namelboxw = "largest box width";
var s_namelis = "LIS name";
var s_namemaxp = "maximum population";
var s_nameminp = "minimum population";
var s_namemden = "maximum density";
var s_namemod = "modulus";
var s_namemultic = "multi-color syntheses";
var s_namemultif = "multiple files";
var s_namemultin = "multiple pattern names";
var s_namenbr = "neighborhood";
var s_namenrot = "number of rotor cells";
var s_namepat = "pattern name";
var s_nameper = "period";
var s_namerar = "rarity";
var s_namerpop = "min/max population";
var s_namerboxa = "rotor box area";
var s_namerboxc = "rotor box circumference";
var s_namerboxd = "rotor box diagonal";
var s_namerboxh = "rotor box height";
var s_namerboxs = "rotor box squareness";
var s_namerboxw = "rotor box width";
var s_namergls = "gliders/bit";
var s_namerule = "rule";
var s_namervol = "relative volatility";
var s_nameslp = "slope";
var s_namesof = "SOF name";
var s_namesvol = "strict volatility"
var s_namesymm = "symmetry";
var s_nametemp = "temperature";
var s_nametts = "time to stabilize";
var s_namevel = "velocity";
var s_namevol = "volatility";
var s_namewiki = "Lifewiki page";
// Tables with human-readable strings that need localization
var rulenames = ["Life (B3/S23)", "2/2 Life (B2/S2)", "3/4 Life (B34/S34)",
  "HighLife (B36/S23)", "Replicator rule (B36/S245)", "EightLife (B3/S238)",
  "Pedestrian Life (B38/S23)", "Honey Life (B38/S238)",
  "LeapLife (B2n3/S23-q)", "VesselLife (B2n3-q5y6c/S23-k)",
  "Niemiec's rule 0 (B3/S2ae3aeijr4-cknqy)", "Niemiec's rule 1 (B3/S2ae3aeijr4-ckqy)",
  "Niemiec's rule 2 (B3/S2aei3aeijr4-cknqy)", "Niemiec's rule 4 (B3/S2ae3aeijr4-cknqy5e)",
  "Niemiec's rule 5 (B3/S2ae3aeijr4-ckqy5e)", "", "", "", "Unknown"];
var catabbrs = "still;p.still;q.still;osc;p.osc;q.osc;sship;p.sship;q.sship;wick-s.;puffer;gun;breeder;cons;meth".split (";");
var catnames = ["still-life", "pseudo-still-life", "quasi-still-life", "oscillator",
  "pseudo-oscillator", "quasi-oscillator", "spaceship", "pseudo-spaceship", "quasi-spaceship",
  "wick-stretcher", "puffer", "gun", "breeder", "constellation", "methuselah", "unknown"];
var dirnames = ["", "orthogonal ", "diagonal ", "not oblique",
  "oblique ", "not diagonal", "not orthogonal", ""];
var resnames = ["", "modulus = period", "modulus = period/2",
  "", "modulus = period/4", "", "modulus < period", ""];
var sortnames = ["population", "average population", "maximum population",
  "min/max population", "influence", "min population/influence",
  "heat", "temperature", "volatility", "strict volatility",
  "strict volatility/volatility", "symmetry", "glide symmetry", "smallest box width",
  "smallest box height", "smallest box diagonal", "smallest box circumference",
  "smallest box area", "smallest box squareness", "largest box width", "largest box height",
  "largest box diagonal", "largest box circumference", "largest box area",
  "largest box squareness", "hull width", "hull height", "hull diagonal", "hull circumference",
  "hull area",  "hull squareness",  "rotor box width", "rotor box height", "rotor box diagonal",
  "rotor box circumference", "rotor box area", "rotor box squareness", "active rotor cells",
  "number of rotors", "period", "modulus", "period/modulus", "velocity", "slope",
  "gliders", "gliders/bit", "glider number", "rule glider number", "frequency",
  "rarity", "time to stabilize", "evolutionary factor", "category",
  "neighborhoods", "header name", "file name", "apg search name", "SOF name",
  "LIS name", "Hickerson Rotor Descriptor", "wiki page", "pattern name", "image", "native"];
var expnames = "RLE;Cells;Life 1.05;Life 1.06;APG;LIS;SOF".split (";");
var phxnames = ";phoenix;not phoenix".split (";");
var rrnames = ";raging river;not raging river;".split (";");
var ffnames = ["", "flip-flop", "on-off", "either flip-flop or on-off",
    "neither flip-flop nor on-off", "not on-off", "not flip-flop", ""];
var rotnames = ["", "babbling brook", "muttering moat",
  "either babbling brook or muttering moat", "neither babbling brook nor muttering moat",
  "not muttering moat", "not babbling brook", ""];
var symmnames = ["C1 (asymmetric)","D2_+ (orthogonal)", "D2_x (diagonal)",
  "C2 (180-degree rotation)", "D4_+ (double orthogonal)", "D4_x (double diagonal)",
  "C4 (90-degree rotation)", "D8 (eight-way)", "C1_+ (orthogonal)", "C1_x (diagonal)",
  "D2 (single reflection)", "D4 (two reflections)",
  "D4|8+ (includes two orthogonal reflections)",
  "D4|8x (includes two diagonal reflections)", "C2|4 (any rotation)",
  "C4 D8 (includes 90-degree reflection)",
  "D2|4|8_+ (includes orthogonal reflection)",
  "D2|4|8_x (includes diagonal reflection)",
  "D4|8 (includes two reflections)", "D2|4|8 (includes any reflection)",
  "C2|4 D4|8 (includes any rotation)", "C2|4 D2|4|8 (includes any symmetry)", "any"];
var wildnames = ["is", "begins with", "ends with", "contains", "", "", "", "",
  "isn't", "doesn't begin with", "doesn't end with", "doesn't contain"];
// Sort list header
var listhdr = new Pattern (0,
  "Image", "Filename", "Apg", "Pattern name(s)", "Cat.", "Pop.",
  "Max.Pop.", "Avg.Pop", "Inf.", "Heat", "Temp.", "Vol.", "Str.Vol.",
  "Symm.", "Sm. Box", "", "Lg. Box", "", "Hull", "", "Period", "Gliders", "Freq.",
  "T.T.S.", "Velocity", "", "", "Neighbor", 0, 0);
listhdr.p_rpop = "Min/Max";
listhdr.p_den = "Min.Den.";
listhdr.p_aden = "Avg.Den.";
listhdr.p_mden = "Max.Den.";
listhdr.p_rvol = "Rel.Vol.";
listhdr.p_glide = "Glide";
listhdr.p_boxd = "Box Diag";
listhdr.p_boxc = "Box Cir.";
listhdr.p_boxa = "Box Ar.";
listhdr.p_boxs = "Box Sq.";
listhdr.p_lboxd = "Lrg.Diag";
listhdr.p_lboxc = "Lrg.Cir.";
listhdr.p_lboxa = "Lrg. Ar.";
listhdr.p_lboxs = "Lrg. Sq.";
listhdr.p_hulld = "Hull Diag";
listhdr.p_hullc = "Hull Cir.";
listhdr.p_hulla = "Hull Ar.";
listhdr.p_hulls = "Hull Sq.";
listhdr.p_rboxw = "Rot.Wid.";
listhdr.p_rboxh = "Rot.Hgt.";
listhdr.p_rboxd = "Rot.Diag";
listhdr.p_rboxh = "Rot.Cir.";
listhdr.p_rboxa = "Rot. Ar.";
listhdr.p_rboxs = "Rot. Sq.";
listhdr.p_act = "Active";
listhdr.p_nrotors = "#Rotors";
listhdr.p_mod = "Modulus";
listhdr.p_rmod = "Per./Mod";
listhdr.p_rgls = "Gl./Bit";
listhdr.p_glna = "Gl#All";
listhdr.p_glnr = "Gl#Rule";
listhdr.p_rar = "Rarity";
listhdr.p_slp = "Slope";
listhdr.p_ef = "E.F.";
listhdr.p_sof = "SOF";
listhdr.p_lis = "LIS";
listhdr.p_hrd = "HRD";
listhdr.p_wiki = "LifeWiki";
listhdr.p_hdr = "Header";
// Miscellaneous human-readable strings that need localization
var sAny = "Any";
var sand = "and";
var sare_shown_per_page = "are shown per page";
var sascending = "ascending";
var saverage = "average";
var sBabbling_brook = "Babbling brook";
var sbit = "bit";
var scategory = "category";
var scell = "cell";
var scells = "cells";
var sClickKnown = "Gliders=KNOWN means that a pattern is known to have a glider " +
  "synthesis, although an explicit synthesis may not have actually been created.";
var sClickTbd = "Gliders=TBD means individual patterns in this group have not " +
  "yet been analyzed for syntheses. Of these, around " +
  "96.7% of still-lifes, 99.7% of pseudo-still-lifes, " +
  "95.5% of P2 oscillators, and 99.96% of P2 pseudo-oscillators " +
  "can be synthesized from smaller or simpler patterns.";
var sd = "d";				// Spaceship direction; diagonal
var sdescending = "descending";
var sDiagonal = "Diagonal";
var sdone = "done";
var sevolutionary_factor = "evolutionary factor";
var sFlip_flop = "Flip-flop";
var sFound = "Found";
var sfound = "found";
var sGlider = "Glider";
var sInfinity = "Infinity";
var sis_shown_per_page = "is shown per page";
var sKnown = "Known";
var sLoading_data_tables = "Loading data tables";
var smatch = "match";
var smatches = "matches";
var smaximum = "maximum";
var smin_max = "min/max";
var sMuttering_moat = "Muttering moat";
var sN_A = "N/A";
var sNeedPattern = "You must supply a pattern";
var sNeedPeriod = "You must supply a period";
var sNeedPeriod2 = "You must supply a period >1";
var sNeedPop = "You must supply a population";
var sNeedRepeat = "You must supply a repeat period";
var sNeedRule = "You must supply a rule";
var sNeedSymm = "You must supply a symmetry";
var sNeedUser = "You must supply a user name or email address";
var snocats = "no valid categories";
var sNotFound = "No matching pattern found in database.";
var sNotPossible = "Conflicting criteria prevent any pattern matches";
var snot_yet_analyzed_for_synthesis = "not yet analyzed for synthesis";
var so = "o";				// Spaceship direction: orthogonal
var sOblique = "Oblique";
var soline = "Mark D. Niemiec's pattern search engine";
var sOn_off = "On-off";
var sor = "or";
var sOrthogonal = "Orthogonal";
var spage = "page";
var sparity = "parity";
var spartial = "partial";
var sPattern = "Pattern";
var sPattern_too_large = "Pattern too large to process";
var spatterns_loaded = "patterns loaded";
var sPage_down = "Page down";
var sPage_up = "Page up";
var sPhoenix = "Phoenix";
var sRaging_river = "Raging river";
var srotor = "rotor";
var srotors = "rotors";
var srule = "rule";
var srules = "rules";
var sRun_methuselah = "Run methuselah";
var sSearch_results = "Search results";
var sSearch_Results = "Search Results";
var sSearch_Results_As_APG = "Search Results as APG";
var sSearch_Results_As_HRD = "Search Results as HRD";
var sSearch_Results_As_LIS = "Search Results as LIS";
var sSearch_Results_As_SOF = "Search Results as SOF";
var sSearching = "Searching";
var ssort_by = "sort by";
var ssquareness = "squareness";
var sstrict = "strict";
var sSwap = "Swap";
var ssynthesis_known_to_exist = "synthesis known to exist";
var sTBD = "TBD";
var stbdzip = "Zip archives cannot currently be saved";
var sthen = "then";
var sThis_stamp_page = "This stamp page";
var sTooLarge = "This pattern is too large to export here";
var sunknown = "unknown";
var sUnknown = "Unknown";
var sunsupported= "unsupported";
var sView_alternate_synthesis = "View alternate synthesis";
var sZip_archive = "Zip archive of all patterns (not yet!)"
var sFont = "12px Verdana";			// stamp font
//------------------------------ Run Initializations ---------------------------
Init ();
// End lifesrch.js
