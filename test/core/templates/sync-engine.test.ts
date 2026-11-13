import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { gunzipSync } from 'zlib';
import { parse as parseYaml } from 'yaml';

import { generateSubagentContent, type SubagentTemplate } from '../../../src/core/shared/subagent-generation.js';
import { ArtifactSyncEngine } from '../../../src/core/templates/sync-engine.js';

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

const RETIRED_SWEEPER_REFERENCE_FIXTURES = {
  'xirang-evidence-protocol.md': 'IyBJbXBhY3QgU3dlZXBlciBFdmlkZW5jZSBQcm90b2NvbAoKMS4gUXVlcnkga25vd24gc3RhYmxlIGlkZW50aXRpZXMgd2l0aCBgeGlyYW5nIGFyY2ggcXVlcnkgPGVsZW1lbnRJZD4gLS1yZWxhdGlvbnMgLS1kZXB0aCAyIC0tanNvbmAuIFByZXNlcnZlIGVhY2ggcmVsYXRpb25zaGlwJ3MgY2Fub25pY2FsIHNvdXJjZS9raW5kL3RhcmdldCBkaXJlY3Rpb24uCjIuIFVzZSBwYXJlbnQgYW5kIGNoaWxkcmVuIGFzIGFic3RyYWN0aW9uL3JlZmluZW1lbnQgY29udGV4dCBvbmx5OyBhZGphY2VuY3kgYWxvbmUgZG9lcyBub3QgcHJvdmUgYG11c3RDaGFuZ2VgLgozLiBSdW4gYHhpcmFuZyBsaXN0IC0tc3BlY3MgLS1qc29uYCBhbmQgdXNlIHRoZSBFbGVtZW50IENvbnRyYWN0IHJlZ2lzdHJ5IHRvIHJlYWQgU3BlY3Mgb3duZWQgYnkgY2FuZGlkYXRlIGVsZW1lbnRzLgo0LiBDb2xsZWN0IGN1cnJlbnQgY29kZSBldmlkZW5jZSBhZnRlciBzZW1hbnRpYyBtYXBwaW5nLiBJZiBDb2RlR3JhcGggaXMgYXZhaWxhYmxlLCB1c2UgaXRzIENMSS9NQ1Agc3ltYm9sLCBjYWxsLCBpbXBvcnQsIGFuZCBibGFzdC1yYWRpdXMgZXZpZGVuY2UgYXMgYW4gb3B0aW9uYWwgYWNjZWxlcmF0b3IuIE5ldmVyIGluc3RhbGwgaXQgYXV0b21hdGljYWxseSBhbmQgbmV2ZXIgcmVhZCBgLmNvZGVncmFwaC9jb2RlZ3JhcGguZGJgLgo1LiBJZiBDb2RlR3JhcGggaXMgdW5hdmFpbGFibGUgb3IgZmFpbHMsIGNvbnRpbnVlIHdpdGggQUNFLCBgcmdgLCBgcmVhZGAsIGFuZCBgZ2l0IGxzLWZpbGVzYDsgZGlzY2xvc2UgcmVkdWNlZCBldmlkZW5jZSBjb3ZlcmFnZSBpbiBgdW5rbm93bmAgb3IgYHF1ZXN0aW9uc2AgcmF0aGVyIHRoYW4gYmxvY2tpbmcuCjYuIFVzZSBjYW5vbmljYWwgYGVsZW1lbnRJZGAgdmFsdWVzIGluIHRoZSByZXBvcnQuIEEgY3VycmVudCBGUU4gTUFZIGFjY29tcGFueSBhbiBlbGVtZW50IG9ubHkgYXMgc291cmNlIG5hdmlnYXRpb24gZXZpZGVuY2UuCjcuIFdoZW4gb3B0aW9uYWxDaGFuZ2VOYW1lIGlzIHByb3ZpZGVkLCBpbnNwZWN0IG9ubHkgdGhhdCBjaGFuZ2UncyBhcnRpZmFjdHM7IGV4Y2x1ZGUgYXJjaGl2ZSBoaXN0b3J5Lgo4LiBDbGFzc2lmeSBmaW5kaW5ncyBhcyBgbXVzdENoYW5nZWAsIGBtdXN0VmVyaWZ5YCwgYGNvbnRleHR1YWxgLCBgdW5rbm93bmAsIG9yIGBhcmNoaXRlY3R1cmVEcmlmdGAuIEV2ZXJ5IGZpbmRpbmcgaW5jbHVkZXMgdGFyZ2V0LCByZWxhdGlvblBhdGgsIHJlYXNvbiwgYW5kIGV2aWRlbmNlLgo5LiBVc2UgYGFyY2hpdGVjdHVyZURyaWZ0YCB3aGVuIFNlbWFudGljIE1vZGVsIHJlbGF0aW9uc2hpcCBldmlkZW5jZSBjb25mbGljdHMgd2l0aCBjdXJyZW50IGNhbGwvaW1wb3J0L3N5bWJvbCBldmlkZW5jZSwgcHJlc2VydmluZyBib3RoIHNpZGVzLgoxMC4gRG8gbm90IHNpbGVudGx5IHVwZ3JhZGUgYW1iaWd1aXR5OiBpbnN1ZmZpY2llbnQgZXZpZGVuY2UgcmVtYWlucyBgdW5rbm93bmAsIGFuZCBzY29wZS1hZmZlY3RpbmcgZ2FwcyBiZWNvbWUgYHF1ZXN0aW9uc2AuCjExLiBXaGlsZSByZWFkaW5nIGFmZmVjdGVkIFNwZWNzLCBydW4gdGhlIHRlcm1pbm9sb2d5IGF3YXJlbmVzcyBzdGVwLg==',
  'xirang-terminology-awareness.md': 'IyBJbXBhY3QgU3dlZXBlciBUZXJtaW5vbG9neSBBd2FyZW5lc3MKCklkZW50aWZ5IHRlcm1zIHNlbWFudGljYWxseSByZWxhdGVkIHRvIHVzZXIncyBgY29uY2VwdGAgaW5wdXQgd2hpbGUgcmVhZGluZyBhZmZlY3RlZCBzcGVjcy4gRXh0cmFjdCBvbmx5IGRvbWFpbiB0ZXJtcyBjbG9zZSB0byB0aGF0IGNvbmNlcHQsIG5vdCBldmVyeSBub3VuIGluIHRoZSBmaWxlOyBpZiBjb25jZXB0IGlzICd3b3JrZmxvdycsIGV4dHJhY3QgJ3Byb2Nlc3MnLCAncGlwZWxpbmUnLCAnZmxvdycgZXRjLiBhbmQgaWdub3JlIHVucmVsYXRlZCB0ZXJtcyBzdWNoIGFzICd0b3BvbG9naWNhbCBzb3J0JyBvciAnYXJ0aWZhY3QnLgoKRm9yIGVhY2ggZXh0cmFjdGVkIHRlcm0sIGNvdW50IG9jY3VycmVuY2VzIGFuZCByZWNvcmQgdGhlIHNwZWMgbmFtZXMgd2hlcmUgaXQgYXBwZWFycy4gVXNlIHRoZSBzcGVjIGlkZW50aWZpZXIgcmV0dXJuZWQgYnkgYHhpcmFuZyBsaXN0IC0tc3BlY3MgLS1qc29uYCB3aGVuIGF2YWlsYWJsZTsgb3RoZXJ3aXNlIHVzZSB0aGUgc3BlYyBkaXJlY3RvcnkgbmFtZSB3aXRob3V0IHBhdGggcHJlZml4ZXMgb3IgZmlsZSBleHRlbnNpb25zLiBTb3J0IGV4dHJhY3RlZCB0ZXJtcyBieSBkZXNjZW5kaW5nIGNvdW50LCB0aGVuIGJ5IHRlcm0uCgpSZWNvcmQgaW4gYHRlcm1pbm9sb2d5T2JzZXJ2YXRpb25zYCBmaWVsZDoKCmBgYGpzb24KewogICJ1c2VySW5wdXQiOiAic3RyaW5nIiwKICAiZm91bmRJblNwZWNzIjogWwogICAgewogICAgICAidGVybSI6ICJzdHJpbmciLAogICAgICAic3BlY3MiOiBbInN0cmluZyJdLAogICAgICAiY291bnQiOiAxCiAgICB9CiAgXQp9CmBgYAoKUmVwb3J0IGZhY3RzIG9ubHksIG5vIGp1ZGdtZW50IG9yIHJlY29tbWVuZGF0aW9ucy4gRG8gbm90IGRlY2lkZSB3aGV0aGVyIHRlcm1zIGFyZSBjb3JyZWN0IG9yIHNob3VsZCBiZSB1bmlmaWVkLiBJZiB0ZXJtaW5vbG9neSBleHRyYWN0aW9uIGZhaWxzLCBvbWl0IGB0ZXJtaW5vbG9neU9ic2VydmF0aW9uc2AgYW5kIGtlZXAgdGhlIHJlcG9ydCB1c2FibGUgd2l0aCBub3JtYWwgaW1wYWN0IGZpZWxkcy4=',
  'xirang-report-schema.md': 'IyBJbXBhY3QgU3dlZXBlciBKU09OIFJlcG9ydCBTY2hlbWEKCmBgYGpzb24KewogICJjb25jZXB0IjogInN0cmluZyIsCiAgInByb2plY3RSb290IjogInN0cmluZyIsCiAgInRlcm1NYXBwaW5ncyI6IFt7ICJ1c2VyVGVybSI6ICJzdHJpbmciLCAicHJvamVjdFRlcm1zIjogWyJzdHJpbmciXSwgImV2aWRlbmNlIjogWyJzdHJpbmciXSB9XSwKICAieGlyYW5nIjogewogICAgImVsZW1lbnRzIjogW3sgImVsZW1lbnRJZCI6ICJzdHJpbmciLCAiZnFuIjogInN0cmluZyBvciBudWxsIiwgInJlYXNvbiI6ICJzdHJpbmciIH1dLAogICAgInJlbGF0aW9uc0V4cGFuZGVkIjogW3sgImZyb20iOiAiZWxlbWVudElkIiwgInR5cGUiOiAic3RyaW5nIiwgInRvIjogImVsZW1lbnRJZCIgfV0KICB9LAogICJtdXN0Q2hhbmdlIjogW3sgInRhcmdldCI6ICJzdHJpbmciLCAicmVsYXRpb25QYXRoIjogW10sICJyZWFzb24iOiAic3RyaW5nIiwgImV2aWRlbmNlIjogWyJzdHJpbmciXSB9XSwKICAibXVzdFZlcmlmeSI6IFt7ICJ0YXJnZXQiOiAic3RyaW5nIiwgInJlbGF0aW9uUGF0aCI6IFtdLCAicmVhc29uIjogInN0cmluZyIsICJldmlkZW5jZSI6IFsic3RyaW5nIl0gfV0sCiAgImNvbnRleHR1YWwiOiBbeyAidGFyZ2V0IjogInN0cmluZyIsICJyZWxhdGlvblBhdGgiOiBbXSwgInJlYXNvbiI6ICJzdHJpbmciLCAiZXZpZGVuY2UiOiBbInN0cmluZyJdIH1dLAogICJ1bmtub3duIjogW3sgInRhcmdldCI6ICJzdHJpbmciLCAicmVsYXRpb25QYXRoIjogW10sICJyZWFzb24iOiAic3RyaW5nIiwgImV2aWRlbmNlIjogWyJzdHJpbmciXSB9XSwKICAiYXJjaGl0ZWN0dXJlRHJpZnQiOiBbeyAidGFyZ2V0IjogInN0cmluZyIsICJyZWxhdGlvblBhdGgiOiBbXSwgInJlYXNvbiI6ICJzdHJpbmciLCAiZXZpZGVuY2UiOiBbIkxpa2VDNCBldmlkZW5jZSIsICJjb2RlIGV2aWRlbmNlIl0gfV0sCiAgInF1ZXN0aW9ucyI6IFsic3RyaW5nIl0sCiAgInRlcm1pbm9sb2d5T2JzZXJ2YXRpb25zIjogewogICAgInVzZXJJbnB1dCI6ICJzdHJpbmciLAogICAgImZvdW5kSW5TcGVjcyI6IFt7ICJ0ZXJtIjogInN0cmluZyIsICJzcGVjcyI6IFsic3RyaW5nIl0sICJjb3VudCI6IDEgfV0KICB9Cn0KYGBgCgpGaWVsZCBuYW1lcyBhcmUgY2Fub25pY2FsLiBPbWl0IGB0ZXJtaW5vbG9neU9ic2VydmF0aW9uc2Agb25seSB3aGVuIGV4dHJhY3Rpb24gaXMgdW5hdmFpbGFibGUuIFJldHVybiB0aGlzIG9iamVjdCBkaXJlY3RseSB0byB0aGUgY2FsbGVyOyBpdCBpcyBldmlkZW5jZSBmb3IgdGhlIGN1cnJlbnQgRXhwbG9yZSBjb252ZXJzYXRpb24sIG5ldmVyIGEgc3luYy9hcmNoaXZlIGlucHV0Lg==',
} as const;

const RETIRED_SWEEPER_AGENT_FIXTURES = [
  'H4sIAAAAAAACA51XTW/cRgy961cQyaUNVmug6CkJAiTOB1LUcWo7aHPzrETtTizNKDMjrxfwj+8jZyTbaRCgOdi7loYc8vHxka7runJm4Kd0Y4Nx29oOo2lSHffMI4eq5dgEOybr3VN69I4dB5OYDPV2u0t7lt/0p73i49/rbfCTa7mlP85PP1B2RIFHHxJ1PpB3TGPwXxiPG+8aHtOaPkWmLviB+GbsfWDacCcfsfEjE6xgMfpoengyrXUcIzW9sUNc08fAHQcE05mYaPAt93pR2tn4IEATmp1NuHeC5xKYZggflhrT9xziUwqTE3vOiZDBjx9somQH9lM6iUeDuTmbnPx9EtePquR9D7tHEtqKtsh1RZ11+L4xcfeoqoFu9fgxnfmeq+qznxAJwHMPYkAGEvQ/ij+9yTCsSU4Hbthe8/eQW+ELwlaETVt71x+Ir23LeLvS0AMjXae2jXHeWeSZS1Nq0lr4T7BLHpBxwWFdVU+elGDOeTDItqETxfbYu8Q36cmTqqYzjr5HaGJoNvg+gRYfS4xn3iNAvHLUe9PqoUwSgGTGndRq6jmS8CXQ5TqT7+h+nY4uNYveN0I48TA5+3V6eAlxzwO7tEZEwqSYzKZnuiyP37dwEu+lL/gkmw5revsXKBpz3lMIeEzRT6Fhcubabo0wnkaTdhrFYA7U7BAi016yQgnLFUjlmuNaETECes/XwAym6lOMkVPfBrGKAlUKKD28H4G94LM6aTKya3rtySEtE+M0SJt19gYNVe6qr8At2ln0IIA6SHckVD8RuiJZ1AsX+D1aNO7sOENymbFFP6BH6jqO3ER8foneKTiCwJuSixQ45K7d4ng4PCM2zY7OYUQ78Q4yRdw09SYsCOiVtEFsePPttRIpoWzhQM+XqrxAAEBKQZZgWhB6R8/diyUw6YgM4WrBb6U3tRpNzBy3rkGHgjloz60XCOJM2cU/sND6XChUDZisdYWHeBg2aOCVtCMaoviUNohZk45x+J0SFuG8PH5zdBm2l/iFSmdiFebAPqeWaTP3IUlXPqM21xQNPPhM5UFarqARxfeDYGlv0w4JUctQuoCMs7RZcCRT/X2nZSuPIw02SlVWc2dfftO4EzhtbC+9cbkWa4gazBQ9RJ5UaCcXp1HMGfqVG6U76D1B23nundVc6pXSVviy+jYH2hol4Mv76qTKlhE6efkZ2UELUAxAsURXUtIySKEWJAUSjaW3UOTspLWx6X3kdk1/+3DV9X4vdNYiD6PtNat9gKAsrIh08un8AjLhx9zIgb9O9g7i0of3MBUfdzg9Q6td89x2ZjlUtFiiElrMqEoePIzQGx0D79043TVZVV0soivkkFTj06q6pbeW+5ZuoSgluFt6fTeH6ba6xWBZfmBQZoMq4i0dIKy39HIW5XlwSBWzoolJGSPL8VMZE8CgLjK3jJnZPHEYVrQvQEvtB2DaKgk6u51KZa/4sMps6sxgewudmKIgBnO92GsSpj/Wez5g98DtzkvEABATpQQgWwlqhPpCQ0BFIBZVhzcY4U5kLAky8HjloAvQnHCBO+Ls7dN8K0S3FxYeaMcmiGZk1fcOlYxmhhSS00yL9QcTgt9LaXdou7JVcB7YOF2hh+6DjtczoPfbUXmWZ7H2pTZtoUynRUYmSeaG72g7sb4BV84TUv52+t6bS9oNP6Gwv836+myO6DsD89r0k0w0XVxmBp7JpiWdGKtKBx1SicuyNtMf0dxpn5K6nRp5qiqiN4LgNc3zPixej8r6OZvXsE0eftdDS78UqGulcE7rmn/9oSOpvHW+99tDbfYySYDuzzrLodexgXSbHznJmEHxTkXxXskaacKhqspYb0Q2sJ5BbKCtK0igyIT2C7aIkLXKuAPI0fOyDKB/6BX2SVHKzWHEblDwnJV1U+5Z52O6/EIlUbay2f13RZzbV5oD7YyjG8ZnrvpbHza2xTloVT61ZCArcsK2gVm5mTCWZXiCwjIysQBbWSq7Ln/D0zRFTU7+RCVEG8vmO8eR91wZB5Klnou1ZB9XCoKGXgazKnNk4XuO83RKDwX11FGcGhQurub1l2+M7riyuejy6zfzGg3qDkpO/z9Kv16g2GMxUHTzvztQfjox4aqFGOXh1eUEy3GW/yTM3Heqw0AmMrYcWXCx7w1Swupfpkb0AZINAAA=',
  'H4sIAAAAAAACA51VTW/jNhC961cMspcWsByg6CktCuwm3SJFEy+cXaB7W1oaWawljpakrBjIj+8bUnJg9ANFD7YoaWb45s3jU1mWhTM935AM4bm0/WCqWIaJeWBf1Bwqb4doxd3Q1S/s2JvIZKiz+zZOrP/0mz3w7ffl3svoaq7p16fNI+VC5HkQH6kRT+KYBi9/MB5X4ioe4po+BabGS0/8PHTimXbc6CVUMjAhCxmDBNOhkqmt4xCo6oztw5o+eG7YA0xjQqReau7SRrG14QKg8VVrI/YdUXkGljpEDUuV6Tr24Yb86DSfcyNk8JPeRoq2ZxnjQ7juzfN2dHr/ENZXRRTpkHel0Fa0R68raqzDemdCe1WU4LZ484a20nFRfJYRSECeu8CADhT05sPT7/RzJmFNGuu5Ynvkv+NthQVAJ35NXYrrTsRHWzPerhJwz2jWpdzKOHEWXebBzBOpLepH5EUBYTyzsE54790wRroVFz1gFsXH83sFovuEm6J4ofeWu5peaMtfR5TT5d2rYOileAED5x8S5ja2IhGxJw74f7sL0o3xtUevbwcTWy2wdHwO32hHGHVZtcbt+ZWRJT2y71c0iT80nUzKVN8bnQkiG7sfIWAFd+DTSvU1usb0trMGy4AGNT1tLKkJ092mfR5xRLC7E0VcRZ3LDEAPD02tQMjGR9uAsUC9OUHJZF0YgEmZQcWDk8lB8P4j9ghLtU/LroFMp+M8UcvG10jOgxF3hDzNQinUUo3n7EfjvUzW7am1Ls7y56wsRBf3zQXpeL0QijPS2xCQuqIQZZhlk8ShJeaXELQOGZ1EYCNpaD9yegOtPEW0fHm8nDnafQY7Wczwi9pKCqGvI/sT/cgd9+xiaeufqCw9dyk6YF0DV0vffflhwZGdheYMur8LWaBnwW3VAVT1oSi2ig/Iw9lE5kOiXSynY7aUeqz0qfaZt4KeS1or1mt/rnmdLHFJLZEXBTXXfU3fzKyWSa25iSN/+49FdMDWSSf7U2km2IA62f8plOGWoWq5N/9WIPMEd9ioO7xTSzP+VBR3AuXASSC1CLOAbdoGRwHmyXqvRg29Td6qz7sT5t/BkOYsHBF6B29T19idBgM3zhwuLrSb91nnsGTE8FCMavaZvxrWckJV/zixCN0xrnnS78XvbI042FGOOnegdh05xAC7HW1X46oqRRGs9lYtrmnyCk/jGFJzeospkAmLCy84sus+vP2cukxxodTuwyqRkKCHbK+Rn1GVVdYZ52aMl565cRTGCmNDxmzG/GyS46opJyuW3WLqkGufBCn/cezrMw2TN0NiNn92Hb6HD8YfanhNMkpqcnNzOOsXzSwHLNksWAk8mPRlDyNYxviKPwE8mSnaGAgAAA==',
  'H4sIAAAAAAACA51XTW/cyBG981cUvJfEICkgyEleLODV2gsHkeVINpK9TU13kexVs4vb1ZwRgfnxQXWTtORsgiQHfQynP6pevfeq2DRNFXCka+BJnho3TmhSI2eiiWJlSUx0U3IcruHVzxQoYiJA8K4f0pn0N/zVPdLNn5s+8hwsWfjLw91HKAdBpIljgo4jcCCYIv9KJoHhYGhKLXwRgi7yCPQ0eY4ER+r0jxieCDjqjokFPURC6wKJgPHoRmnhU6SOIiB0KAlGtuTzRWlw8iJAjGZwiUyaI22B5Qxb+OTAoPcU5RriHHQ/lUQAgwUeXYLkRuI53crViE/3c9DPt9K+qhKzl2t4paHV0EeaauhcsDUcUYZXVdM0VfXdd3DPnqrqF54BIwGGFzFQzEHffXr4B7wrILSgayMZcif6PdxqMOw9ZXzRNhz8AnRyloKhOgceKc0x5L0GAwdn0JfCrBWxLpJJfoHEkAZaUWir6vXrHMoDjRiSM3Cbcb3hkOgpvX5dNXBPwv5EeRsehf2cCD6tEd4zp1q/CuAZbV5UCAJ9xGnQOs2eBJQrEQ6t0u7qeYWuDjkDz0appvvn4H6bX14B5GmkkNqqyRyShEdPcFgff7AHQHmWumKTXFpaeP+3j+Ck5DzHSCGB8BwNQcCT61G5DhOmIUcx4gJmwNATnDUnDNvNMPKJpM14oALu6YQhwYT5TN1sBudt1F2iQKWIRk+/itS5UA4xBdcWfmIInABF5lEF1rknsttdzaMLFgZHUYFaVBcpEiYIJMmFXi/gc6Aog5s2SA6KLHgnCZpGJjICTfOrcMjQaP7v1ky0uLGotXeS4vIGCM0ADxMZGPTsQCAu9LPHuOefL4SjC9aF/uWlGiX8NlNc4Pu9Ij9A00TyGWANxdKUBvg+/LCHpToo8NU7dnW+x+ZYpHDbBcOjC/0Vz6lnTV82su7nD27KtfmcYTJsKddUapBlPLKXWkXIMa1nKv2lONENW/o5U5UjvL15d3WI/eHqoEorpFpZ48appFYos+kPVI1vwJZ6TpFHLjQeVWorGqJnvwgWzi4NPCewZDxGsquhuZBWmn/octHWxwKjE61JvSn68I1k54AndF51cWh1t0u6LaM3eUrZXucg86TbydarSLol3xOzkDfd1Fuh60xZZUv9bQ7QYybf2+eulB2tIHT79hew1Ee0pFDs0a0p5TJooXYkFZIci3ejW2G2ToxnIdvC3zk+dp7PSuZc5HFyPmd1ji7RzgqB2y8Pn0EST0XEkX6b3VeIVw0+w1TP+IrTGwh0ok1yuC9aPVijUlpsqGoeNE5pabP5fwjT/FViVfV5N1slh6Yq11V1gfeOvIUL3G/BXeCnr90XLtWlaZr9p7psPSG74QUWErjA282Ot4ahVSxuplvW9rEvv9P2wJaa1eL29rJtTxTHGs4r0Fr7cURtcIZD5/p5rewjLXVhU4ej8w4jzKKIURzzxZyTQH+T7/mII8EFAmvEJmmTWwPQSQTOAwsBxuQ6NEmyBx8JXFATS4pMdYHHwOfwRSh+pjjKdtqX7VYB9MrCBQbCqJ5RHJ/DiaLgBil0bOZ990eMkc9a2sGFtM4SVNo0XKrqQ/cCdI47oM/lmHlWenDWZRbtSpkuF9kFSdozuIN+pvxNW1UPCWP6tu8+60lZDf+zv/5pc9c3Wzy/0ypP6GftZXlY2fh3r9OV6lCqKre4NJDsA9pG/tA/c75MaTsbfZo9JN94XVUNlD4f9zOv8ri5bW2myIkN+3a08IcV5CaTt6R0oj/+20O03i6w535p8Kz9g0T+n4NKuI2YgUb8TwcUnNA2d+pxP+q4iHGpqrWJGzUKqtVeXLfUYEmNISuETxSLO2FYoHOe9tY/C8GPKIN643GZUGTFcPPS43pPW5blIXd0Koh1hvvXYXATrMrB85ksHMnzuVT6Pcejs5YC3Kyr9gx0FE4k2h2Ps/NW22WQpE2yht7p+Nh15T9JmGbJyelHz3kaWSfcLY4y0WoD0CzzOmk0e6kzCDn0tRVnLxZSjpc47+b00kLvAshsDInU26BLT5inWZ1U8pjLx21g7ljp0StI/13Z2x2Gc8QpI1teaQIg3GJ8tHwOpVV1Jbl1OenbAm46y67LEYQmzG9NMo+jlq/6J/lVuGV0DQAA',
] as const;

function retiredAgentTemplate(compressedArtifact: string): SubagentTemplate {
  const artifact = gunzipSync(Buffer.from(compressedArtifact, 'base64')).toString('utf8');
  const match = artifact.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/);
  if (!match) throw new Error('Invalid historical Sweeper artifact fixture');
  const frontmatter = parseYaml(match[1]) as Record<string, string>;
  return {
    name: frontmatter.name,
    description: frontmatter.description.replace(/ Pi callers: run foreground and omit timeoutMs\/maxRuntimeMs\.$/, ''),
    prompt: match[2].replace(/\n$/, ''),
    tools: frontmatter.tools.split(',').map(tool => tool.trim()),
    disallowedTools: ['write', 'edit'],
    mode: 'read-only',
  };
}

// Exact retired generated bytes prove ownership; custom same-name files are not managed.
const RETIRED_OPTIMIZER_REFERENCE_FIXTURES = {
  "xirang-self-read-protocol.md": "H4sIAAAAAAACA4VWXW/cNhB8169YwA9tgTsa6ScQGwaMOGgCtHZgJ+1jRUurEw2KlEnq7EvR/95ZUro7Byn6cpD5sTs7M7v0Cd2MyQzmMwe6Y9utb1m39CH45Btvqyr/2XiX+DmRcZR6E8mHlsPr6pWiP7Q1rU5MTa/dhq/1wKv5+8qEFWnX0hj8Azfp1vukqu8VlZDLmVP1OCFI2q1jQiD1EL1bIVNjp9a4DRIyBW4kZYuPreEnwYPtaOSk7LcGJxL+JMvthkNZDX5CduBNPhiOBYxsdNrg3OFWPEPgr2OyfpMRWXrq2SECsQ7WgKwSHWQ4ZkBT9Kcc+EqIAmB3SvyML8DIuUyKFJ0eY+9lDXnwK8CmIPVq5JwRS/FbDruMg0akVs8mIM1p4I4Du4bjaVlZLzn3d4aWdKSHqd0M7BLtbxBK2r3ObGhwsBW2fJqJjqQBIiudq/wGC1PqwWLaKbpmRCYzjD4kIcTbdn/sw+XdHfT3w2g5cXskFIo5qJSVPl6JnyK3K/hqT0GDiKDIuORfIikKn5EG8U+zCjEZawH+cULAOG+NOkYx0G32TOFSL3ZotM1gcVKqiTqZ2Jl8dzDl3sxLua6qH2bjws2jj9qCWhTA0Wxc/pQ4O7TQoF0yDV2xTZomZxJ+0C1Hzvh74KQH37JdsWXRJa4CW52J6M0YV5Ix/nN6cKwvPZqPCKmd2VAX/LC3QllTOz1YmB/+SbkEOPY+ivD1YNz7YURNvwGorcUVtfVPtap+nAur73XkN34YTKpL8CMz63G0u7WJvsAsXhR022UApF4n+tWIh3BqCypNOstyUmM95CXT5VrMMExJ31sGZabNZpTM1jiWdpoBwwrG5eCq+gkIJ0f1BtFb03V0foB6oZR69/byitZrh+GzFl/XGVk+Lk6bIjbRZyHVZ4LABNEF+JFNAEkwio0fOd/D6iRwJRJ1wOH01mxK2dXPM1mdcXBQnotiU99JQxQxi0j72iTkUYYOoyeq6hdFl0IpfDKyk5M7evs8aie9Qt/egIt3fvxOVdXJyf+cqaq8uMyzuTPRXfC45TBPkbKJsuLi0BeWK4LXxU1o/6aXOLALnUsdCZ1/ARZbHlNPr/A16tQLr2KEWsnTIbkzZ1nkckk6qsxHQh+jmTmMgROGKBIcA8gT21GAzN6JJAkHXsB5nKS/zmNOxO36kAEOuFiQZMGW+QPiGqtDSVL6v4Uv1mvRLaC4+iDym3kpLmMEqpVSmikEcSQAxGwCev/fdcglGe1tzowgA2tXWlHGlB9Jd7ici+z9qAiDj4RLVaJg4ICowPJgUuHYTymi2ONnFJJm88DhGD8+ZFshLBIVtflZnk8mhynzF0bNZMu4jbh6PxnblmMKAVBO94UXZPrPU3CVPW7cxPRkUr+YK9+e/aVmA2ZXNtjI8yDS75/uPtL1zUe6L2+Md7npD69A0mHDKaITDrvWN7Nc+XqAWfFPh3GZgS/bKKsnb3d+ivLGemHLj7Io8zdPdVEETx8UUf8CN96r3PIIAAA=",
  "xirang-decision-rules.md": "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",
  "xirang-output-protocol.md": "H4sIAAAAAAACA3VVwXLjNgy9+ysw6tV2e05OabaHdNJ4Zzc97XgqmoQsbihSJUE72jQz/Zp+WL+kAOVI9nb3YlkgAD48PEA/wKYn29kvGGGTqc8E72OgoINbLD4g5egheIRE0WqCXz9uHiCG7A04NHsOUvzXB0g5FrP1e+hjSHi1WNR1/TkFv3hZAFTGRtRkg0/VFXxiC8BL+eUzF7SSIz55gaqxDotTlaL+Ud7WlKrtEqo0dLvgTmflf7WF1+VbmtD3IVL2lgZ2qVKP2jZWg2Zs6Elw7Rx21RRgu15pEl8dvI5ICDv02FiaffBgDXqN5dJTppUOBmE62U7OXGLoOvTmrZyqC0YwlHdQ5mDZf3J/wuEdJrsvnqTiHkmIzpppxyUotw/RUtstIUTgnAoaF45zfB8xYTyU5LfMLEVlPY387LBVB8tx1CqCLieCiB2fn8Hl+pkPLqhk4PY768dCQzQY0cClB+yzNeqy5INydir3U0WYKBVRaKdsl/h6HIT5A15ezMTf4wGdlN7afTtXxb1oJs6/Oos2PYn1ggYdEv3PaLDnPnAWO4ppe8aaFVqHD6jS2KRjOzBOm2ASKUTlnxK0TEJV4l75t6SoFBF2PY1anQLujCTavH9c/fv3P5VolSnLcnN1wMgSQFOsuetULPIcpyhkYslgNcqYo0I/43rY/HFz+3i3ebj5+f6XanSYE/BYrqRhIOJ1OQlsZhs6lYgHU7QYTYJji6PdhdCDXJCqxasM52KxgvqsFfUS6pl8eRO6+SntrIXlGpTW2BNIV5bQobF5VCdzv+Z0N2cU7pCNUIdxvxSJrDvr784uBOacGYDQQNKhxyswgbeJSFVGGSwt3yzWN07xgFqW11egBR5FZJkrD9KbgeNTdvzOvhck1nDkgSp0UMtObXAGpFWi9ZGm+kRxLfU84HGuKMFvv398hNBZYgimvi7+t/d3fI9M8ah71G3AxNsB4wBCJUn34xoeA4yiBFkFXBOr64wu5kDSJdUhw/8z8yAtIScGxDpTo8hY0M/c+p/gtaDjjLk3woo6SzSBcsyJGU5CQLOEJJdLOvt9tUb8zHnQ/GWwQd52RbZxkuR6vRbDxVYU2/YEqT6NR31qYVkAPP8cEHKCC9FDU9YTfgN7QldQXHM7ppGoobGe180XTLOghXJWkTBmZWMVuQ8hF6UXSbqjGrgf0rXS99CvnChn7vQoCg6K57M0orMn0NfM8Yi+LNQyRzOKsl+1itJyOilyHkXOdFQyiwyBZbHjWegE2rtR2gUaPqPOpPgDBb0i3WJi6dum4Udjn7kwUs/Bs/bkgJGVj6wwmbgT5bu8XvwHKCjLzc0HAAA="
} as const;

describe('ArtifactSyncEngine subagent artifacts', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `xirang-sync-engine-${randomUUID()}`);
    await fs.mkdir(path.join(testDir, '.xirang'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('retires the old configuration and artifact references only when ownership is proven', async () => {
    const references = path.join(testDir, '.xirang', 'references');
    await fs.mkdir(references);
    const previous = {
      'xirang-configuration-use.md': 'H4sIAAAAAAACA3VVXY/bNhB8969YoA8BClt9PxcFDr1Leui5H7kEQVEUME2tpK0pUiGp8/nfd5aSlYuLvFiWtLucnZ0dfUc/B99IO0aTJXj6mHi1+nPkeCZuGrZZnpnsVyG5i2FsO9q/SDS+nd/SEMO/iN+vKbHTRLzKHVMj7OpEnrnmmnw4VXQXcM0UWXzmOETGf3Oiv253jxW95zExuWA0/OuTja9RUhK1o9TGW6ZTJw74xhjZ5y19LsBNawTBDWrjDMfPxuerSrYDck7VarWhPZAnfsSD0bS8L6fsEZ75JeNuGNyZciDjXLkRaw4408QsjbE5VfQ2OBdONKeQSZRGDeR6DVY4cXxWMiQn6tl4/F/TzsRjHU4ebA1sxTiFFFGPYyoI+tFlceJ5qutzRTtJSSbCy0E2sskMagOFg5O2tFZpR3F0nP6+QHyo/5n6EAQHP7Wjo+lNtp1WvESCfc3EPRqsa9Hp31Az9YeMHiwE3yapuRQ4jOLyBmTfcSNe9Pw1vbsMR9v4wP3ggHINATxjHiAnMp5Y7tFTIS8SvxhEIcaoioaQQIe2gNDPo8SCkCJQHIw9ErK9okuAYPIcU8pd+lpgLdWUMmV3iylQHQppeVYB1Zyk9eXEtLC8JiDPZwK80ReiIMcSMvN+RTv9MU2aiY3tSuQbsB2lFQ8A8+C/MVrM7Lbo7FqLaMjzCS/MmLsQASGopk9RMhLJmwxFu42bE6ikr0m8dWNdNlAyIK+1RxtlUKi4m7bAKOVtME6fSDpOwktj35soSsX9NJcExgpfAROMOnvJr/q1xgePrXBAe2Sfbujpl9vHxx92H58+rCnPAphq5zjaApk6NgoQRz/c4SeB397Qkc8Kht1sNedBwQ8md7jYAGS+nmDaoDhqsCdwmAi0vzIPk+OEMUIDmCKntCn71QBfqfikzoTr5XhQRfe+dZK6LUS2+/3u4e3D/d0S148pkxqSbi90ajN+JeWF24o+Se5UDMsQLjRpI1mtqObGYOakY9PEA3fmWULUub8HkGkp0xixg7xZLCsMfBnU7KI3s0wAKNG+WFM1F39IYSJtv6XbiLXGZKawFtPqObZcgX5Moj3Do8vTA/zbdqjgOPOt+uWcOZugxijpkndgEq1V3+8r+i34zatBnkI8flkp9W30iywsXjGExazh+yaby9cBL6730PjzlU0nCw5U8q/9bVUG/f8vw/JRCCO4a76szGLV2GSoWX2Dzxh8zQN7VRAYnfbjMNlaNmArv1FxZI2AcCFOKM1CZtPHcb/ZXMrSj1L/VFbVCaiaTeLADQ5/9S2cJriFJlROR3wIQY0Lh9md1NDRTAePhK3BjThOElXHatQk1VYWo179BwEgXGG5BwAA',
      'xirang-artifact-specs.md': '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',
    };
    for (const [name, compressed] of Object.entries(previous)) await fs.writeFile(path.join(references, name), gunzipSync(Buffer.from(compressed, 'base64')));
    const request = { toolId: 'pi', projectPath: testDir, workflows: ['propose', 'snack'], version: 'test' };
    expect((await ArtifactSyncEngine.syncOne(request)).error).toBeUndefined();
    for (const name of Object.keys(previous)) {
      expect(await exists(path.join(references, name))).toBe(false);
      await fs.writeFile(path.join(references, name), 'User-owned guidance');
    }
    expect((await ArtifactSyncEngine.syncOne(request)).error).toBeUndefined();
    for (const name of Object.keys(previous)) expect(await fs.readFile(path.join(references, name), 'utf8')).toBe('User-owned guidance');
    const common = await fs.readFile(path.join(testDir, '.pi', 'skills', 'xirang-common', 'SKILL.md'), 'utf8');
    expect(common).toContain('xirang config project --select context --json');
    expect(await exists(path.join(references, 'xirang-configuration-edit.md'))).toBe(true);
    expect(await exists(path.join(references, 'xirang-artifact-semantic-delta.md'))).toBe(true);
    for (const name of ['xirang-propose', 'xirang-snack']) {
      const skill = await fs.readFile(path.join(testDir, '.pi', 'skills', name, 'SKILL.md'), 'utf8');
      expect(skill).toContain('semantic-delta');
      if (name === 'xirang-snack') expect(skill).toContain('--artifact semantic-delta');
      expect(skill).not.toContain('xirang-artifact-specs.md');
    }
  });

  it('writes workflow skills and internal subagent artifacts for native tools', async () => {
    const summary = await ArtifactSyncEngine.syncAll([
      { toolId: 'claude', projectPath: testDir, workflows: ['propose', 'explore'], version: 'test' },
      { toolId: 'pi', projectPath: testDir, workflows: ['propose', 'explore'], version: 'test' },
      { toolId: 'opencode', projectPath: testDir, workflows: ['propose', 'explore'], version: 'test' },
      { toolId: 'codex', projectPath: testDir, workflows: ['propose', 'explore'], version: 'test' },
    ]);

    expect(summary.failed).toEqual([]);

    const guidancePath = path.join(testDir, '.xirang', 'references', 'xirang-semantic-refinement.md');
    expect((await fs.readFile(guidancePath, 'utf8')).trim().length).toBeGreaterThan(0);


    for (const [toolDir, ext] of [
      ['.claude', 'md'],
      ['.pi', 'md'],
      ['.opencode', 'md'],
      ['.codex', 'toml'],
    ] as const) {
      await expect(
        fs.stat(path.join(testDir, toolDir, 'skills', 'xirang-propose', 'SKILL.md'))
      ).resolves.toBeDefined();
      await expect(
        fs.stat(path.join(testDir, toolDir, 'skills', 'xirang-explore', 'SKILL.md'))
      ).resolves.toBeDefined();

      for (const name of [
        'xirang-reviewer',
        'xirang-optimizer',
      ]) {
        await expect(
          fs.stat(path.join(testDir, toolDir, 'agents', `${name}.${ext}`))
        ).resolves.toBeDefined();
        expect(await exists(path.join(testDir, toolDir, 'skills', name, 'SKILL.md'))).toBe(false);
      }
    }
  });

  it.each(['apply', 'archive', 'explore', 'build', 'snack'])('retires only owned Optimizer references and resolves internal-agent references for %s', async workflow => {
    const referencesDir = path.join(testDir, '.xirang', 'references');
    const agentsDir = path.join(testDir, '.pi', 'agents');
    await fs.mkdir(referencesDir, { recursive: true });
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.writeFile(path.join(agentsDir, 'xirang-optimizer.md'), '---\nname: xirang-optimizer\nmetadata: { generatedBy: test, xirangAgent: xirang-optimizer }\nmodel: "custom-optimizer"\n---\nOld generated prompt');
    for (const [name, compressed] of Object.entries(RETIRED_OPTIMIZER_REFERENCE_FIXTURES)) {
      await fs.writeFile(path.join(referencesDir, name), gunzipSync(Buffer.from(compressed, 'base64')));
    }
    const request = { toolId: 'pi', projectPath: testDir, workflows: [workflow], version: 'test' };
    expect((await ArtifactSyncEngine.syncOne(request)).error).toBeUndefined();
    for (const name of Object.keys(RETIRED_OPTIMIZER_REFERENCE_FIXTURES)) {
      expect(await exists(path.join(referencesDir, name))).toBe(false);
      await fs.writeFile(path.join(referencesDir, name), `User-owned replacement for ${name}\n`);
    }
    expect((await ArtifactSyncEngine.syncOne(request)).error).toBeUndefined();
    for (const name of Object.keys(RETIRED_OPTIMIZER_REFERENCE_FIXTURES)) {
      expect(await fs.readFile(path.join(referencesDir, name), 'utf8')).toBe(`User-owned replacement for ${name}\n`);
    }
    for (const role of ['optimizer', 'reviewer']) {
      const content = await fs.readFile(path.join(agentsDir, `xirang-${role}.md`), 'utf8');
      for (const match of content.matchAll(/\.xirang\/references\/(xirang-[a-z0-9-]+\.md)/g)) {
        expect(await exists(path.join(referencesDir, match[1])), match[1]).toBe(true);
      }
    }
    if (workflow === 'snack') {
      const skill = await fs.readFile(path.join(testDir, '.pi', 'skills', 'xirang-snack', 'SKILL.md'), 'utf8');
      for (const match of skill.matchAll(/\.xirang\/references\/(xirang-(?:artifact-[a-z-]+|configuration-edit)\.md)/g)) {
        expect(await exists(path.join(referencesDir, match[1])), match[1]).toBe(true);
      }
    }
    const optimizer = await fs.readFile(path.join(agentsDir, 'xirang-optimizer.md'), 'utf8');
    const metadata = parseYaml(optimizer.match(/^---\n([\s\S]*?)\n---\n/)![1]);
    expect(metadata.model).toBe('custom-optimizer');
    expect(metadata.tools.split(', ')).toEqual(['read', 'grep', 'find', 'bash', 'write', 'edit']);
    for (const name of ['quality-cli', 'quality-recovery', 'optimization-failure-diagnosis']) {
      expect((await fs.readFile(path.join(referencesDir, `xirang-${name}.md`), 'utf8')).length).toBeGreaterThan(0);
    }
  });

  it('does not delete an existing decomposition reference when its generator is retired', async () => {
    const referencesDir = path.join(testDir, '.xirang', 'references');
    const retiredReference = path.join(referencesDir, 'xirang-decomposition-use.md');
    const legacyContent = '# Previously generated decomposition guidance\n';
    await fs.mkdir(referencesDir, { recursive: true });
    await fs.writeFile(retiredReference, legacyContent);

    const result = await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    expect(result.error).toBeUndefined();
    await expect(fs.readFile(retiredReference, 'utf8')).resolves.toBe(legacyContent);
    const common = await fs.readFile(path.join(testDir, '.pi', 'skills', 'xirang-common', 'SKILL.md'), 'utf8');
    const explore = await fs.readFile(path.join(testDir, '.pi', 'skills', 'xirang-explore', 'SKILL.md'), 'utf8');
    expect(common).toContain('xirang-decomposition-authoring.md');
    expect(explore).toContain('xirang config project --select decomposition --json');
    expect(explore).not.toContain('xirang-decomposition-use.md');
  });

  it('removes only explicitly named stale shared references', async () => {
    const referencesDir = path.join(testDir, '.xirang', 'references');
    await fs.mkdir(referencesDir, { recursive: true });
    await fs.writeFile(path.join(referencesDir, 'xirang-apply-phase2-optimization.md'), '<!-- Generated by Xirang -->\nstale');
    for (const retired of [
      'xirang-apply-step-3-phase1-verification.md',
      'xirang-apply-step-4-phase2-optimization.md',
      'xirang-apply-step-5-phase3-seal.md',
      'xirang-definition-framing.md',
    ]) {
      await fs.writeFile(path.join(referencesDir, retired), '<!-- Generated by Xirang -->\nstale');
    }
    await fs.writeFile(path.join(referencesDir, 'user-reference.md'), 'user');

    const result = await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['apply'],
      version: 'test',
    });

    expect(result.error).toBeUndefined();
    expect(await exists(path.join(referencesDir, 'xirang-apply-phase2-optimization.md'))).toBe(false);
    for (const retired of [
      'xirang-apply-step-3-phase1-verification.md',
      'xirang-apply-step-4-phase2-optimization.md',
      'xirang-apply-step-5-phase3-seal.md',
      'xirang-definition-framing.md',
    ]) {
      expect(await exists(path.join(referencesDir, retired))).toBe(false);
    }
    expect(await exists(path.join(referencesDir, 'user-reference.md'))).toBe(true);
  });

  it('removes generated retired Sweeper agents but preserves user-owned same-name files', async () => {
    const piAgents = path.join(testDir, '.pi', 'agents');
    const claudeAgents = path.join(testDir, '.claude', 'agents');
    await fs.mkdir(piAgents, { recursive: true });
    await fs.mkdir(claudeAgents, { recursive: true });
    const generated = (name: string) => `---\nname: ${name}\ndescription: generated\nmetadata:\n  generatedBy: test\n---\n\n## Role\n\nYou are an impact sweeper for Xirang Explore.\n`;
    await fs.writeFile(path.join(piAgents, 'xirang-impact-sweeper.md'), generated('xirang-impact-sweeper'));
    await fs.writeFile(path.join(piAgents, 'opsx-impact-sweeper.md'), generated('opsx-impact-sweeper'));
    const userAgent = 'User notes: You are an impact sweeper for Xirang Explore. This is not generated.\n';
    await fs.writeFile(path.join(claudeAgents, 'xirang-impact-sweeper.md'), userAgent);

    await ArtifactSyncEngine.syncAll([
      { toolId: 'pi', projectPath: testDir, workflows: ['explore'], version: 'test' },
      { toolId: 'claude', projectPath: testDir, workflows: ['explore'], version: 'test' },
    ]);

    expect(await exists(path.join(piAgents, 'xirang-impact-sweeper.md'))).toBe(false);
    expect(await exists(path.join(piAgents, 'opsx-impact-sweeper.md'))).toBe(false);
    await expect(fs.readFile(path.join(claudeAgents, 'xirang-impact-sweeper.md'), 'utf8')).resolves.toBe(userAgent);
  });

  it('removes byte-exact historical Sweeper agents from every renderer', async () => {
    const tools = [
      ['claude', '.claude', 'md'],
      ['pi', '.pi', 'md'],
      ['opencode', '.opencode', 'md'],
      ['codex', '.codex', 'toml'],
    ] as const;

    for (const compressedArtifact of RETIRED_SWEEPER_AGENT_FIXTURES) {
      const template = retiredAgentTemplate(compressedArtifact);
      for (const [toolId, toolDir, extension] of tools) {
        const agentsDir = path.join(testDir, toolDir, 'agents');
        const agentPath = path.join(agentsDir, `${template.name}.${extension}`);
        await fs.mkdir(agentsDir, { recursive: true });
        await fs.writeFile(agentPath, generateSubagentContent(template, toolId, 'historical'));

        const result = await ArtifactSyncEngine.syncOne({
          toolId,
          projectPath: testDir,
          workflows: ['explore'],
          version: 'test',
        });

        expect(result.error).toBeUndefined();
        expect(await exists(agentPath)).toBe(false);
      }
    }
  });

  it('removes generated retired Sweeper references but preserves user-owned same-name content', async () => {
    const referencesDir = path.join(testDir, '.xirang', 'references');
    await fs.mkdir(referencesDir, { recursive: true });
    await fs.writeFile(
      path.join(referencesDir, 'xirang-evidence-protocol.md'),
      Buffer.from(RETIRED_SWEEPER_REFERENCE_FIXTURES['xirang-evidence-protocol.md'], 'base64')
    );
    await fs.writeFile(
      path.join(referencesDir, 'xirang-terminology-awareness.md'),
      Buffer.from(RETIRED_SWEEPER_REFERENCE_FIXTURES['xirang-terminology-awareness.md'], 'base64')
    );
    await fs.writeFile(
      path.join(referencesDir, 'xirang-report-schema.md'),
      '# Impact Sweeper JSON Report Schema\n\nUser-authored replacement content.\n'
    );

    await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    expect(await exists(path.join(referencesDir, 'xirang-evidence-protocol.md'))).toBe(false);
    expect(await exists(path.join(referencesDir, 'xirang-terminology-awareness.md'))).toBe(false);
    await expect(fs.readFile(path.join(referencesDir, 'xirang-report-schema.md'), 'utf8')).resolves.toBe(
      '# Impact Sweeper JSON Report Schema\n\nUser-authored replacement content.\n'
    );

    await fs.writeFile(
      path.join(referencesDir, 'xirang-report-schema.md'),
      Buffer.from(RETIRED_SWEEPER_REFERENCE_FIXTURES['xirang-report-schema.md'], 'base64')
    );
    await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });
    expect(await exists(path.join(referencesDir, 'xirang-report-schema.md'))).toBe(false);
  });

  it.each([
    ['claude', '.claude/commands/xirang/apply.md', '.claude/commands/xirang/custom.md'],
    ['github-copilot', '.github/prompts/xirang-apply.prompt.md', '.github/prompts/custom.prompt.md'],
  ])('removes the retired %s apply command without touching user commands', async (toolId, retiredPath, userPath) => {
    await fs.mkdir(path.dirname(path.join(testDir, retiredPath)), { recursive: true });
    await fs.writeFile(path.join(testDir, retiredPath), '---\nmetadata: { generatedBy: test }\n---\nlegacy Search/Replace workflow');
    await fs.writeFile(path.join(testDir, userPath), 'user command');

    const result = await ArtifactSyncEngine.syncOne({
      toolId,
      projectPath: testDir,
      workflows: ['apply'],
      version: 'test',
    });

    expect(result.error).toBeUndefined();
    expect(result.commandsRemoved).toBe(1);
    expect(await exists(path.join(testDir, retiredPath))).toBe(false);
    expect(await fs.readFile(path.join(testDir, userPath), 'utf-8')).toBe('user command');
  });

  it('uses path.join-compatible subagent paths and tool-specific extensions', async () => {
    const result = await ArtifactSyncEngine.syncOne({
      toolId: 'codex',
      projectPath: testDir,
      workflows: ['apply'],
      version: 'test',
    });

    expect(result.error).toBeUndefined();
    await expect(
      fs.stat(path.join(testDir, '.codex', 'agents', 'xirang-optimizer.toml'))
    ).resolves.toBeDefined();
    await expect(
      fs.stat(path.join(testDir, '.codex', 'agents', 'xirang-reviewer.toml'))
    ).resolves.toBeDefined();
    expect(await exists(path.join(testDir, '.codex/agents/xirang-optimizer.md'))).toBe(false);
  });

  it('cleans up generated internal skill directories by explicit managed name', async () => {
    const skillsDir = path.join(testDir, '.claude', 'skills');
    for (const name of [
      'xirang-reviewer',
      'xirang-optimizer',
      'xirang-impact-sweeper',
      'opsx-impact-sweeper',
      'opsx-implementer',
      'user-skill',
    ]) {
      await fs.mkdir(path.join(skillsDir, name), { recursive: true });
      await fs.writeFile(
        path.join(skillsDir, name, 'SKILL.md'),
        name === 'user-skill' ? name : `---\nmetadata:\n  generatedBy: test\n---\n\n${name}\n`,
      );
    }

    const result = await ArtifactSyncEngine.syncOne({
      toolId: 'claude',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    expect(result.error).toBeUndefined();
    for (const name of [
      'xirang-reviewer',
      'xirang-optimizer',
      'xirang-impact-sweeper',
      'opsx-impact-sweeper',
      'opsx-implementer',
    ]) {
      expect(await exists(path.join(skillsDir, name))).toBe(false);
    }
    expect(await exists(path.join(skillsDir, 'xirang-explore', 'SKILL.md'))).toBe(true);
    expect(await exists(path.join(skillsDir, 'user-skill', 'SKILL.md'))).toBe(true);
  });

  it('preserves a user-owned retired Sweeper skill directory without generated ownership', async () => {
    const skillFile = path.join(testDir, '.pi', 'skills', 'xirang-impact-sweeper', 'SKILL.md');
    await fs.mkdir(path.dirname(skillFile), { recursive: true });
    await fs.writeFile(skillFile, 'user-owned skill');

    await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    await expect(fs.readFile(skillFile, 'utf8')).resolves.toBe('user-owned skill');
  });

  it('preserves same-name unmarked skills, agents and their reference files', async () => {
    const skill = path.join(testDir, '.pi', 'skills', 'xirang-explore', 'SKILL.md');
    const agent = path.join(testDir, '.pi', 'agents', 'xirang-reviewer.md');
    const nested = path.join(path.dirname(skill), 'references', 'my-notes.md');
    const shared = path.join(testDir, '.xirang', 'references', 'xirang-configuration-edit.md');
    for (const file of [skill, agent, nested, shared]) {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, `User instructions: ${path.basename(file)}`);
    }
    await ArtifactSyncEngine.syncOne({ toolId: 'pi', projectPath: testDir, workflows: ['explore'], version: 'test' });
    for (const file of [skill, agent, nested, shared]) expect(await fs.readFile(file, 'utf8')).toBe(`User instructions: ${path.basename(file)}`);
  });

  it('preserves user references inside a managed skill during refresh and removal', async () => {
    const request = { toolId: 'pi', projectPath: testDir, workflows: ['explore'], version: 'test' };
    await ArtifactSyncEngine.syncOne(request);
    const skillDir = path.join(testDir, '.pi', 'skills', 'xirang-explore');
    const notes = path.join(skillDir, 'references', 'my-notes.md');
    await fs.mkdir(path.dirname(notes), { recursive: true });
    await fs.writeFile(notes, 'User notes');

    const refreshed = await ArtifactSyncEngine.syncOne(request);
    expect(refreshed.error).toBeUndefined();
    expect(await fs.readFile(notes, 'utf8')).toBe('User notes');
    const removed = await ArtifactSyncEngine.syncOne({ ...request, workflows: ['archive'] });
    expect(removed.error).toBeUndefined();
    expect(await exists(path.join(skillDir, 'SKILL.md'))).toBe(false);
    expect(await fs.readFile(notes, 'utf8')).toBe('User notes');
  });

  it('preserves same-name and unrelated user-defined Agent files', async () => {
    const agentsDir = path.join(testDir, '.pi', 'agents');
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.writeFile(path.join(agentsDir, 'my-custom.md'), 'custom');
    await fs.writeFile(path.join(agentsDir, 'xirang-reviewer.md'), 'stale');

    const result = await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    expect(result.error).toBeUndefined();
    await expect(fs.readFile(path.join(agentsDir, 'my-custom.md'), 'utf-8')).resolves.toBe('custom');
    await expect(fs.readFile(path.join(agentsDir, 'xirang-reviewer.md'), 'utf-8')).resolves.toBe('stale');
  });

  it.each(['pi', 'claude', 'opencode'].flatMap(toolId => ['\n', '\r\n'].map(newline => ({ toolId, newline }))))('preserves user-set model on $toolId update with $newline', async ({ toolId, newline }) => {
    const agentsDir = path.join(testDir, `.${toolId}`, 'agents');
    await fs.mkdir(agentsDir, { recursive: true });

    // Pre-create agent file with user-customized model
    await fs.writeFile(
      path.join(agentsDir, 'xirang-reviewer.md'),
      `---
name: xirang-reviewer
metadata: { generatedBy: test, xirangAgent: xirang-reviewer }
description: test
tools: read, grep
model: "anthropic/claude-sonnet-4"
---

User-changed prompt.`.replace(/\n/g, newline)
    );

    const result = await ArtifactSyncEngine.syncOne({
      toolId,
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    const content = await fs.readFile(path.join(agentsDir, 'xirang-reviewer.md'), 'utf-8');
    expect(result.error).toBeUndefined();
    expect(content).not.toContain('User-changed prompt.');
    expect(content).toContain('model: "anthropic/claude-sonnet-4"');
  });

  it('preserves user-set model value in toml agent on update', async () => {
    const agentsDir = path.join(testDir, '.codex', 'agents');
    await fs.mkdir(agentsDir, { recursive: true });

    // Pre-create toml agent file with user-customized model
    await fs.writeFile(
      path.join(agentsDir, 'xirang-reviewer.toml'),
      `# Generated by Xirang: xirang-reviewer test
name = "xirang-reviewer"
description = "test"
model = "gpt-5"
sandbox_mode = "read-only"

developer_instructions = """
stale
"""
`
    );

    await ArtifactSyncEngine.syncOne({
      toolId: 'codex',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    const content = await fs.readFile(path.join(agentsDir, 'xirang-reviewer.toml'), 'utf-8');
    expect(content).toContain('model = "gpt-5"');
  });

  it('does not preserve model when set to inherit', async () => {
    const agentsDir = path.join(testDir, '.pi', 'agents');
    await fs.mkdir(agentsDir, { recursive: true });

    // Pre-create agent file with model: 'inherit'
    await fs.writeFile(
      path.join(agentsDir, 'xirang-reviewer.md'),
      `---
name: xirang-reviewer
metadata: { generatedBy: test, xirangAgent: xirang-reviewer }
description: test
tools: read, grep
model: "inherit"
---

Stale prompt.`
    );

    await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    const content = await fs.readFile(path.join(agentsDir, 'xirang-reviewer.md'), 'utf-8');
    // model: "inherit" is a sentinel for 'no override' — should be stripped
    expect(content).not.toContain('model:');
  });

  it('generated content has no model field when template has no model', async () => {
    await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    const content = await fs.readFile(
      path.join(testDir, '.pi', 'agents', 'xirang-reviewer.md'),
      'utf-8'
    );
    // Fresh generation without override should not write model
    expect(content).not.toContain('model:');
  });
});
