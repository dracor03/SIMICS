/* module_id.c - automatically generated, do not edit */
/* ccache:disable */

#include <simics/build-id.h>
#include <simics/base/types.h>
#include <simics/util/help-macros.h>

#if defined(SIMICS_7_API)
#define BUILD_API "7"
#elif defined(SIMICS_6_API)
#define BUILD_API "6"
#else
#define BUILD_API "?"
#endif

#define EXTRA "                                           "

EXPORTED const char _module_capabilities_[] =
	"VER:" SYMBOL_TO_STRING(SIM_VERSION_COMPAT) ";"
	"ABI:" SYMBOL_TO_STRING(SIM_VERSION) ";"
	"API:" BUILD_API ";"
	"BLD:" "0" ";"
	"BLD_NS:__simics_project__;"
	"BUILDDATE:" "1793064821" ";"
	"MOD:" "rv32-atomic" ";"
	"CLS:rv32-atomic;CLS:rv32-atomic-core" ";"
	""
	"HOSTTYPE:" "win64" ";"
	"THREADSAFE;"
	EXTRA ";";
EXPORTED const char _module_date[] = "Mon Oct 26 19:33:41 2026";
EXPORTED void _simics_module_init(void);
extern void sim_iface_wrap_init(void);

extern void init_local(void);

void
_simics_module_init(void)
{

	init_local();
}
